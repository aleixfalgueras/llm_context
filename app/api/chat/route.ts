import {MessageService} from '@/services/message-service'
import {ChatService} from '@/services/chat-service'
import {revalidatePath} from 'next/cache'
import {openRouterService} from '@/services/openrouter'
import {logger} from '@/lib/logger'
import {getDefaultModel} from '@/lib/models-config'
import {checkModelAccess} from "@/lib/api/api-validation";
import {ApiContext, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {SubscriptionErrorCode} from "@/services/error-codes";
import {Role} from '@prisma/client';

/**
 * Chat API endpoint that handles AI chat interactions with streaming responses.
 *
 * Manages the complete chat flow including model access validation, chat creation/retrieval,
 * client context integration, and AI response streaming. Supports both new chat creation
 * and continuation of existing chats with full client context awareness.
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
 * @returns StreamingResponse - Server-sent events stream with data types:
 *   - `content`: Streaming AI response content chunks
 *   - `complete`: Final completion signal with chatId and optional newTitle
 *   - `error`: Error information with message details
 *
 * Authentication & Validation:
 * 1. Authentication handled by withEnhancedApi middleware
 * 2. Token usage validation and limits checking
 * 3. Model access verification based on subscription tier
 *
 * Chat Processing:
 * 1. Parse and validate request parameters
 * 2. Create new chat or retrieve existing chat with messages
 * 3. Build client context system prompt from selected fields
 * 4. Process user message and save to database
 * 5. Stream AI response with real-time content delivery
 * 6. Save complete AI response and update token usage
 *
 * Error Handling:
 * - MODEL_ACCESS_DENIED: Subscription tier doesn't allow requested model
 * - Chat creation/retrieval failures return appropriate error messages
 * - Streaming errors are caught and sent as error events
 * - Client disconnects during streaming save partial messages
 *
 * Token Usage:
 * - Input tokens tracked on user messages
 * - Output tokens tracked on assistant messages  
 * - Fallback to OpenRouter generation stats if usage data missing
 * - Rough estimation (4 chars/token) as final fallback
 */
export const POST = withEnhancedApi(
  async ({userId, req}: ApiContext) => {
    let chatId: string = '';

    // Parse request body
    const {messages, chatId: requestChatId, model, clientId, contextFields} = await parseJsonBody(req)
    chatId = requestChatId;

    // Use the model from the request, with fallback to centralized default
    const selectedModel = model || getDefaultModel()

    // Validate model access based on user's subscription tier
    const modelAccessResult = await checkModelAccess(userId, selectedModel)
    if (!modelAccessResult) {
      throw new Error(SubscriptionErrorCode.MODEL_ACCESS_DENIED)
    }

    // LAZY CHAT CREATION: If no chatId provided, create a new chat first
    let chat: any = null;
    let client: any = null;

    if (!chatId) {
      // Create new chat - clientId and contextFields are required for new chats
      const newChatResult = await ChatService.createNewChat(userId, clientId, contextFields || [])
      
      if (!newChatResult.success) {
        throw new Error(newChatResult.error)
      }

      chat = newChatResult.data.chat
      client = newChatResult.data.client
      chatId = chat.id
    } else {
      // Get existing chat
      const existingChatResult = await ChatService.getChatWithMessagesById(chatId, userId)
      
      if (!existingChatResult.success) {
        throw new Error(existingChatResult.error)
      }

      chat = existingChatResult.data
    }

    // Prepare chat data for AI processing
    const lastMessage = messages[messages.length - 1]
    const prepareResult = await ChatService.prepareChatForAI(chat, userId, lastMessage.content)
    
    if (!prepareResult.success) {
      throw new Error('Failed to prepare chat for AI processing')
    }

    const { aiMessages, client: chatClient, isFirstUserMessage } = prepareResult.data
    
    // Use the client from the preparation if we don't have one yet (for existing chats)
    if (!client) {
      client = chatClient
    }

    // Save the user message to the database (tokens will be updated after AI response)
    const userMessageResult = await MessageService.createMessage({
      content: lastMessage.content,
      role: Role.USER,
      model: selectedModel,
      tokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      chat: { connect: { id: chatId } }
    }, userId)
    
    if (!userMessageResult.success) {
      throw new Error(userMessageResult.error || 'Failed to save user message' )
    }
    const userMessage = userMessageResult.data

    // If this is the first user message, update the chat title only if it's still the default
    const titleUpdateResult = await ChatService.updateChatTitleForFirstMessage(
      chatId, 
      userId, 
      client.name, 
      isFirstUserMessage, 
      chat.title
    )

    if (titleUpdateResult.success && titleUpdateResult.data.updated) {
      // Revalidate the chat page to show the updated title
      revalidatePath(`/assistant/chat/${chatId}`)
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
          completionStream = openRouterService.createStreamingCompletion(
            {model: selectedModel, messages: aiMessages},
            {userId, resourceId: chatId}
          );

          for await (const chunk of completionStream) {
            if (chunk.isComplete) {
              // Final chunk - save the complete message to database
              let finalUsage = chunk.usage;

              // Fallback: Query generation stats if usage data is missing
              if (!finalUsage && chunk.generationId) {
                try {
                  // Add a small delay - generation stats might not be immediately available
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const stats = await openRouterService.getGenerationStats(chunk.generationId);

                  if (stats.data && (stats.data.tokens_prompt || stats.data.tokens_completion)) {
                    finalUsage = {
                      promptTokens: stats.data.tokens_prompt || 0,
                      completionTokens: stats.data.tokens_completion || 0,
                      totalTokens: (stats.data.tokens_prompt || 0) + (stats.data.tokens_completion || 0)
                    };
                  } else {
                    console.log('Generation stats available but no token data:', stats);
                  }
                } catch (error) {
                  console.error('Failed to get generation stats:', error);

                  // If generation stats fail, provide a rough estimate based on content length
                  // This is a very rough estimate: ~4 characters per token for English text
                  const estimatedCompletionTokens = Math.ceil(fullContent.length / 4);
                  const estimatedPromptTokens = Math.ceil(JSON.stringify(aiMessages).length / 4);

                  finalUsage = {
                    promptTokens: estimatedPromptTokens,
                    completionTokens: estimatedCompletionTokens,
                    totalTokens: estimatedPromptTokens + estimatedCompletionTokens
                  };

                  console.log('Using estimated token counts:', finalUsage);
                }
              }

              // Update user message with input tokens
              const tokenUpdateResult = await MessageService.updateMessageTokens(
                userMessage.id,
                userId,
                {
                  inputTokens: finalUsage?.promptTokens || 0,
                  tokensUsed: finalUsage?.promptTokens || 0
                }
              )
              
              if (!tokenUpdateResult.success) {
                logger.error(
                  'Failed to update user message tokens',
                  new Error(tokenUpdateResult.error),
                  { userId, chatId, metadata: {messageId: userMessage.id }})
              }

              // Save the assistant's response to the database
              const assistantMessageResult = await MessageService.createMessage({
                content: fullContent,
                role: Role.ASSISTANT,
                model: selectedModel,
                tokensUsed: finalUsage?.completionTokens || 0,
                inputTokens: 0, // inputTokens for assistant message
                outputTokens: finalUsage?.completionTokens || 0,
                chat: { connect: { id: chatId } }
              }, userId)
              
              if (!assistantMessageResult.success) {
                logger.error('Failed to save assistant message', new Error(assistantMessageResult.error || 'Unknown error'), { userId, chatId })
              }
              logger.info('Assistant message saved', {userId, chatId});

              // Send completion signal
              const completionData = {
                type: 'complete',
                chatId: chatId, // Include chatId for new chats
                newTitle: titleUpdateResult.success && titleUpdateResult.data.updated ? titleUpdateResult.data.newTitle : undefined
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
                  const partialMessageResult = await MessageService.createMessage({
                    content: fullContent,
                    role: Role.ASSISTANT,
                    model: selectedModel,
                    tokensUsed: 0, // 0 tokens for partial message
                    inputTokens: 0,
                    outputTokens: 0,
                    chat: { connect: { id: chatId } }
                  }, userId)
                  if (partialMessageResult.success) {
                    logger.info('Partial assistant message saved', {userId, chatId});
                  } else {
                    logger.error('Failed to save partial assistant message', new Error(partialMessageResult.error || 'Unknown error'), { userId, chatId })
                  }
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
    expectedContentType: 'application/json',
    requireToken: true
  })