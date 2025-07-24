import {prisma} from '@/lib/prisma'
import {createMessage} from '@/lib/actions/message'
import {revalidatePath} from 'next/cache'
import {generateChatTitleWithClient} from '@/lib/utils/general'
import {buildClientContextSection, hasClientContext} from '@/lib/utils/client-context'
import {createAICompletionStream} from '@/lib/ai/wrapper'
import {logger} from '@/lib/logger'
import {NextResponse} from 'next/server'
import {getDefaultModel, getModelsByTier} from '@/lib/ai/models-config'
import {ApiSubscriptionErrorCode} from '@/types/enums'
import {checkModelAccess, withClientAccess, withTokenValidation} from "@/lib/middleware/validation-middleware";
import {OpenRouterClient} from "@/lib/ai/openrouter";
import {ApiContext, parseJsonBody, withEnhancedApi} from '@/lib/middleware/api-middleware'

/**
 * Chat API endpoint that handles AI chat interactions with streaming responses.
 *
 * It manages the complete chat flow including model access validation, chat
 * creation/retrieval, client context integration, and AI response streaming. It supports
 * both new chat creation and continuation of existing chats with full client context awareness.
 *
 * @param context - ApiContext object containing userId and request
 * @param context.userId - Authenticated user ID (provided by withEnhancedApi middleware)
 * @param context.req - NextRequest object containing chat data
 * @param context.req.body.messages - Array of chat messages with content and role
 * @param context.req.body.chatId - Optional existing chat ID (creates new chat if not provided)
 * @param context.req.body.model - AI model to use (defaults to system default if not specified)
 * @param context.req.body.clientId - Required client ID for new chats, determines context
 * @param context.req.body.contextFields - Array of client context fields to include in system prompt
 *
 * @returns StreamingResponse - Server-sent events stream with the following data types:
 *   - `content`: Streaming AI response content chunks
 *   - `complete`: Final completion signal with chatId and optional newTitle
 *   - `error`: Error information with type, message, and retry details
 *
 * @throws 400 - Missing required fields (clientId for new chats)
 * @throws 403 - Model access denied based on subscription tier
 * @throws 404 - Chat or client not found
 * @throws Standard HTTP errors handled automatically by withEnhancedApi middleware
 *
 * Authentication & Validation Flow:
 * 1. Authentication handled automatically by withEnhancedApi middleware
 * 2. Token usage validation and limits checking
 * 3. Model access verification based on subscription tier
 *
 * Chat Processing Flow:
 * 1. Parse and validate request parameters
 * 2. Create new chat or retrieve existing chat with messages
 * 3. Build client context system prompt from selected fields
 * 4. Process user message and save to database
 * 5. Stream AI response with real-time content delivery
 * 6. Save complete AI response and update token usage
 */
export const POST = withEnhancedApi(
  async ({userId, req}: ApiContext) => {
    let chatId: string = '';

    // Token validation using composable middleware
    await withTokenValidation(userId)

    // Parse request body
    const {messages, chatId: requestChatId, model, clientId, contextFields} = await parseJsonBody(req)
    chatId = requestChatId;

    // Use the model from the request, with fallback to centralized default
    const selectedModel = model || getDefaultModel()

    // Validate model access based on user's subscription tier
    const modelAccess = await checkModelAccess(userId, selectedModel)
    if (!modelAccess.allowed) {
      const availableModels = getModelsByTier(modelAccess.tier)
      const modelNames = availableModels.map(m => m.name).join(', ')

      logger.warn('Model access denied', {
        userId,
        chatId,
        metadata: {
          requestedModel: selectedModel,
          userTier: modelAccess.tier,
          userPlan: modelAccess.plan
        }
      });

      return NextResponse.json({
        error: `Your ${modelAccess.plan} plan doesn't include access to this model. Available models: ${modelNames}`,
        code: ApiSubscriptionErrorCode.MODEL_ACCESS_DENIED,
        tier: modelAccess.tier,
        plan: modelAccess.plan,
        modelId: selectedModel,
        upgradeUrl: '/subscription'
      }, {status: 403})
    }

    logger.info('Chat request authenticated, model access and token usage validated', {
      userId,
      chatId,
      model: selectedModel
    });

    // LAZY CHAT CREATION:
    // If no chatId provided, create a new chat first
    let chat: any = null;

    if (!chatId) {
      // Create new chat - clientId and contextFields are required for new chats
      if (!clientId) {
        logger.warn('Chat creation attempted without client ID', {userId});
        return NextResponse.json({error: 'Client selection is required for new chat'}, {status: 400})
      }

      // Verify client exists and belongs to user
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId
        },
        select: {name: true}
      })

      if (!client) {
        logger.warn('Client not found for chat creation', {userId, clientId});
        return NextResponse.json({error: 'Client not found'}, {status: 404})
      }

      // Create new chat with client name in title
      const chatTitle = generateChatTitleWithClient(client.name)

      chat = await prisma.chat.create({
        data: {
          title: chatTitle,
          userId,
          clientId,
          contextFields: contextFields || [],
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      chatId = chat.id
      logger.info('New chat created', {
        userId,
        chatId,
        clientId,
        metadata: {title: chatTitle, contextFieldCount: (contextFields || []).length}
      });
    } else {
      // Get existing chat
      chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!chat) {
        logger.warn('Chat not found', {userId, chatId});
        return NextResponse.json({error: 'Chat not found'}, {status: 404})
      }
    }

    logger.info('Chat data retrieved', {
      userId,
      chatId,
      clientId: chat.clientId,
      metadata: {messageCount: chat.messages.length}
    });

    const existingMessages = chat.messages

    // Check if this is the first user message
    const isFirstUserMessage = existingMessages.length === 0

    // Format messages for AI provider
    const aiMessages: Array<{
      role: 'system' | 'user' | 'assistant',
      content: string
    }> = existingMessages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // Get client information for this chat (required)
    const client = await withClientAccess(userId, (chat as any).clientId)

    // Build and add system message with client context for ALL messages (not just first)
    logger.info('Adding client context system message', {
      userId,
      chatId,
      clientId: client.id,
      metadata: {
        clientName: client.name,
        selectedContextFields: (chat as any).contextFields || [],
        isFirstMessage: isFirstUserMessage
      }
    });

    // Build chat system prompt with user-selected client context
    const selectedContextFields = (chat as any).contextFields || []
    const clientContextSection = buildClientContextSection(client, selectedContextFields)
    const hasContext = hasClientContext(selectedContextFields)

    const systemPrompt = `You are a professional AI assistant helping a marketing service provider with their business.${hasContext ? ' You have access to the following client information and should use it to provide personalized, relevant advice and responses.' : ''}${clientContextSection}

INSTRUCTIONS:
- ${hasContext ? 'Use this client information to personalize your responses when relevant' : 'Provide helpful general business advice'}
- ${hasContext ? 'Reference their specific circumstances when it adds value to your response' : 'Keep responses broadly applicable but actionable'}
- Be professional, knowledgeable, and supportive
- Help with any aspect of marketing business operations: strategy, client management, content creation, campaigns, analysis, operations, industry insights, problem-solving, etc.
- Provide practical, actionable advice tailored to marketing professionals
- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`

    // Log the complete system prompt
    logger.info('System prompt created for chat', {
      userId,
      chatId,
      clientId: client.id,
      metadata: {
        systemPrompt,
        promptLength: systemPrompt.length,
        hasClientContext: hasContext,
        contextFields: selectedContextFields,
        clientName: client.name,
        isFirstMessage: isFirstUserMessage
      }
    });

    // Always add system message for consistent client context
    aiMessages.unshift({
      role: 'system',
      content: systemPrompt,
    })

    // Add the new user message
    const lastMessage = messages[messages.length - 1]
    aiMessages.push({
      role: 'user' as const,
      content: lastMessage.content,
    })

    // Save the user message to the database (tokens will be updated after AI response)
    const userMessage = await createMessage(chatId, lastMessage.content, 'USER', selectedModel)
    logger.info('User message saved', {
      userId,
      chatId,
      model: selectedModel,
      metadata: {messageLength: lastMessage.content.length}
    });

    // If this is the first user message, update the chat title only if it's still the default
    if (isFirstUserMessage && chat.title === 'New Chat') {
      const newTitle = generateChatTitleWithClient(client.name)

      await prisma.chat.update({
        where: {
          id: chatId,
          userId,
        },
        data: {
          title: newTitle,
        },
      })

      logger.info('Chat title updated', {
        userId,
        chatId,
        metadata: {newTitle}
      });

      // Revalidate the chat page and home page to show the updated title
      revalidatePath(`/assistant/chat/${chatId}`)
      revalidatePath('/')
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullContent = ''
        let completionStream: any = null

        // Helper function to safely enqueue data
        const safeEnqueue = (data: Uint8Array) => {
          try {
            controller.enqueue(data)
            return true
          } catch (error) {
            // Controller is closed/aborted - client disconnected
            return false
          }
        }

        try {
          // Use unified AI wrapper with automatic usage tracking (streaming version)
          logger.aiRequest(selectedModel, undefined, {userId, chatId});

          completionStream = createAICompletionStream(
            {
              model: selectedModel,
              messages: aiMessages
            },
            {
              userId,
              resourceId: chatId
            }
          );

          for await (const chunk of completionStream) {
            if (chunk.isComplete) {
              // Final chunk - save the complete message to database
              logger.info('AI response received', {
                userId,
                chatId,
                model: selectedModel,
                metadata: {
                  responseLength: fullContent.length,
                  tokensUsed: chunk.usage?.totalTokens
                }
              });

              let finalUsage = chunk.usage;

              // Fallback: Query generation stats if usage data is missing
              if (!finalUsage && chunk.generationId) {
                try {
                  // Add a small delay - generation stats might not be immediately available
                  await new Promise(resolve => setTimeout(resolve, 1000));

                  const client = new OpenRouterClient();
                  const stats = await client.getGenerationStats(chunk.generationId);

                  if (stats.data && (stats.data.tokens_prompt || stats.data.tokens_completion)) {
                    finalUsage = {
                      promptTokens: stats.data.tokens_prompt || 0,
                      completionTokens: stats.data.tokens_completion || 0,
                      totalTokens: (stats.data.tokens_prompt || 0) + (stats.data.tokens_completion || 0)
                    };
                  } else {
                    console.log('DEBUG: Generation stats available but no token data:', stats);
                  }
                } catch (error) {
                  console.log('DEBUG: Failed to get generation stats:', error);

                  // If generation stats fail, provide a rough estimate based on content length
                  // This is a very rough estimate: ~4 characters per token for English text
                  const estimatedCompletionTokens = Math.ceil(fullContent.length / 4);
                  const estimatedPromptTokens = Math.ceil(JSON.stringify(aiMessages).length / 4);

                  finalUsage = {
                    promptTokens: estimatedPromptTokens,
                    completionTokens: estimatedCompletionTokens,
                    totalTokens: estimatedPromptTokens + estimatedCompletionTokens
                  };

                  console.log('DEBUG: Using estimated token counts:', finalUsage);
                }
              }

              // Update user message with input tokens and save assistant's response
              await prisma.message.update({
                where: {id: userMessage.id},
                data: {
                  inputTokens: finalUsage?.promptTokens || 0,
                  tokensUsed: finalUsage?.promptTokens || 0
                }
              })
              logger.info('User message updated with token info', {
                userId,
                chatId,
                metadata: {inputTokens: finalUsage?.promptTokens}
              });

              // Save the assistant's response to the database
              await createMessage(
                chatId,
                fullContent,
                'ASSISTANT',
                selectedModel,
                finalUsage?.completionTokens,
                0, // inputTokens for assistant message
                finalUsage?.completionTokens
              )
              logger.info('Assistant message saved', {userId, chatId});


              // Send completion signal
              const completionData = {
                type: 'complete',
                chatId: chatId, // Include chatId for new chats
                newTitle: isFirstUserMessage && chat.title === 'New Chat' ? generateChatTitleWithClient(client.name) : undefined
              }

              if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(completionData)}\n\n`))) {
                // Client disconnected during completion, but message is already saved
                logger.info('Client disconnected during completion signal', {userId, chatId});
                return
              }

              controller.close()
            } else if (chunk.content) {
              // Stream content chunk
              fullContent += chunk.content
              const data = {
                type: 'content',
                content: chunk.content
              }

              if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))) {
                // Client disconnected during streaming - save partial message
                logger.info('Client disconnected during streaming, saving partial message', {
                  userId,
                  chatId,
                  metadata: {partialLength: fullContent.length}
                });

                if (fullContent.trim()) {
                  // Save the partial assistant's response to the database
                  await createMessage(chatId, fullContent, 'ASSISTANT', selectedModel, 0) // 0 tokens for partial message
                  logger.info('Partial assistant message saved', {userId, chatId});
                }

                return
              }
            }
          }
        } catch (error) {
          logger.error('Error in streaming chat', error as Error, {chatId});

          // Abort the completion stream if still active
          try {
            if (completionStream) {
              // Try to cancel/abort the stream if possible
              if (typeof completionStream.return === 'function') {
                await completionStream.return()
              }
            }
          } catch (streamAbortError) {
            logger.warn('Failed to abort completion stream', {
              chatId,
              metadata: {error: (streamAbortError as Error).message}
            });
          }

          const errorData = (error as Error | undefined)?.message ?? 'Internal Server Error'

          if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))) {
            // Client disconnected, just log and exit
            logger.info('Client disconnected during error response', {userId, chatId});
            return
          }

          try {
            controller.close()
          } catch {
            // Controller already closed, ignore
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  },
  {
    context: 'Chat API',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  })