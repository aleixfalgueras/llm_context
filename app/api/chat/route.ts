import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions/message'
import { revalidatePath } from 'next/cache'
import { generateChatTitleWithClient } from '@/lib/utils/general'
import { buildClientContextSection, hasClientContext } from '@/lib/utils/client-context'
import { createAICompletionStream } from '@/lib/ai/wrapper'
import { AIProviderError } from '@/lib/ai/errors'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getDefaultModel, getModelsByTier } from '@/lib/ai/models-config'
import { checkModelAccess } from '@/lib/subscription/subscription-utils'
import { withAuth, withTokenValidation, withClientAccess } from '@/lib/middleware/api-middleware'
import { handleApiError } from '@/lib/utils/error-handler'
import { ApiSubscriptionErrorCode } from '@/types/enums' 

export async function POST(req: Request) {
  const endTiming = logger.startTiming('Chat API');
  let chatId: string = '';
  let userId: string = '';
  
  try {
    // Authentication and token validation using composable middleware - FIRST
    userId = await withAuth()
    await withTokenValidation(userId)

    // Parse request body after authentication
    const { messages, chatId: requestChatId, model, clientId, contextFields } = await req.json()
    chatId = requestChatId;
    logger.apiRequest('POST', '/api/chat', { chatId, clientId, model });
    
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
      }, { status: 403 })
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
        logger.warn('Chat creation attempted without client ID', { userId });
        return NextResponse.json({ error: 'Client selection is required for new chat' }, { status: 400 })
      }

      // Verify client exists and belongs to user
      logger.dbQuery('findFirst', 'client', { userId, clientId });
      const client = await prisma.client.findFirst({
        where: { 
          id: clientId,
          userId 
        },
        select: { name: true }
      })

      if (!client) {
        logger.warn('Client not found for chat creation', { userId, clientId });
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      // Create new chat with client name in title
      const chatTitle = generateChatTitleWithClient(client.name)
      
      logger.dbQuery('create', 'chat', { userId, clientId });
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
        metadata: { title: chatTitle, contextFieldCount: (contextFields || []).length }
      });
    } else {
      // Get existing chat
      logger.dbQuery('findFirst', 'chat', { userId, chatId });
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
        logger.warn('Chat not found', { userId, chatId });
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
    }

    logger.info('Chat data retrieved', { 
      userId, 
      chatId,
      clientId: chat.clientId,
      metadata: { messageCount: chat.messages.length }
    });

    const existingMessages = chat.messages

    // Check if this is the first user message
    const isFirstUserMessage = existingMessages.length === 0

    // Format messages for AI provider
    const aiMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = existingMessages.map((msg: any) => ({
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
    logger.dbQuery('create', 'message', { userId, chatId });
    const userMessage = await createMessage(chatId, lastMessage.content, 'USER', selectedModel)
    logger.info('User message saved', { 
      userId, 
      chatId, 
      model: selectedModel,
      metadata: { messageLength: lastMessage.content.length }
    });

    // If this is the first user message, update the chat title only if it's still the default
    if (isFirstUserMessage && chat.title === 'New Chat') {
      const newTitle = generateChatTitleWithClient(client.name)
      
      logger.dbQuery('update', 'chat', { userId, chatId });
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
        metadata: { newTitle }
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
          logger.aiRequest(selectedModel, undefined, { userId, chatId });
          
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
                  
                  const { OpenRouterClient } = await import('@/lib/ai/openrouter/client');
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
              logger.dbQuery('update', 'message', { userId, chatId });
              await prisma.message.update({
                where: { id: userMessage.id },
                data: {
                  inputTokens: finalUsage?.promptTokens || 0,
                  tokensUsed: finalUsage?.promptTokens || 0
                }
              })
              logger.info('User message updated with token info', { 
                userId, 
                chatId, 
                metadata: { inputTokens: finalUsage?.promptTokens }
              });

              // Save the assistant's response to the database
              logger.dbQuery('create', 'message', { userId, chatId });
              await createMessage(
                chatId, 
                fullContent, 
                'ASSISTANT', 
                selectedModel, 
                finalUsage?.completionTokens,
                0, // inputTokens for assistant message
                finalUsage?.completionTokens
              )
              logger.info('Assistant message saved', { userId, chatId });


              // Send completion signal
              const completionData = {
                type: 'complete',
                chatId: chatId, // Include chatId for new chats
                newTitle: isFirstUserMessage && chat.title === 'New Chat' ? generateChatTitleWithClient(client.name) : undefined
              }
              
              if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(completionData)}\n\n`))) {
                // Client disconnected during completion, but message is already saved
                logger.info('Client disconnected during completion signal', { userId, chatId });
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
                  metadata: { partialLength: fullContent.length }
                });
                
                if (fullContent.trim()) {
                  // Save the partial assistant's response to the database
                  logger.dbQuery('create', 'message', { userId, chatId });
                  await createMessage(chatId, fullContent, 'ASSISTANT', selectedModel, 0) // 0 tokens for partial message
                  logger.info('Partial assistant message saved', { userId, chatId });
                }
                
                return
              }
            }
          }
        } catch (error) {
          logger.error('Error in streaming chat', error as Error, { chatId });
          
          // Abort the completion stream if still active
          try {
            if (completionStream) {
              // Try to cancel/abort the stream if possible
              if (typeof completionStream.return === 'function') {
                await completionStream.return()
              }
            }
          } catch (streamAbortError) {
            logger.warn('Failed to abort completion stream', { chatId, metadata: { error: (streamAbortError as Error).message } });
          }
          
          // Handle AI provider errors specifically
          if (error instanceof AIProviderError) {
            const errorData = {
              type: 'error',
              error: error.message,
              provider: error.provider,
              errorType: error.type,
              retryAfter: error.retryAfter
            }
            if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))) {
              // Client disconnected, just log and exit
              logger.info('Client disconnected during error response', { userId, chatId });
              return
            }
          } else {
            const errorData = {
              type: 'error',
              error: 'Internal Server Error'
            }
            if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))) {
              // Client disconnected, just log and exit
              logger.info('Client disconnected during error response', { userId, chatId });
              return
            }
          }
          
          try {
            controller.close()
          } catch {
            // Controller already closed, ignore
          }
        }
      }
    })

    logger.apiResponse('POST', '/api/chat', 200, { 
      userId, 
      chatId,
      metadata: { 
        streaming: true
      }
    });
    
    endTiming();
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    return handleApiError(error, {
      context: 'chat API',
      userId,
      resourceId: chatId,
      operation: 'chat',
      cleanup: () => {
        logger.apiResponse('POST', '/api/chat', 500, { chatId });
        endTiming();
      }
    });
  }
} 