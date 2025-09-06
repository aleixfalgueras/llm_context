import {MessageService} from '@/services/message-service'
import {ChatService, NEW_CHAT_DEFAULT_TITLE} from '@/services/chat-service'
import {revalidatePath} from 'next/cache'
import {openRouterService, OpenRouterService} from '@/services/openrouter'
import {logger} from '@/lib/logger'
import {getDefaultModel} from '@/lib/models-config'
import {checkModelAccess} from "@/lib/api/api-validation";
import {ApiContext, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {SubscriptionErrorCode} from "@/services/error-codes";
import {Role} from '@prisma/client';
import {getLocaleFromCookies} from '@/lib/utils/locale-cookie-server'
import {ChatWithMessages} from "@/lib/types/chat-types";
import {StreamChunk} from "@/lib/types/openrouter-types";

/**
 * Chat API endpoint that handles streaming responses:
 *  - Parse request parameters
 *  - Validates model access
 *  - Create new chat or retrieve existing chat with messages
 *  - Get chat's client data, if any
 *  - Saves user message
 *  - Updates chat title + revalidate if first message
 *  - Format all messages for OpenRouter request
 *  - Creates and return StreamingResponse
 *
 * @param context.req.body.messages - Array of chat messages with content and role
 * @param context.req.body.chatId - Optional existing chat ID (creates new chat if not provided)
 * @param context.req.body.model - AI model to use (defaults to system default if not specified)
 * @param context.req.body.clientId - Required client ID for new chats, determines context
 * @param context.req.body.contextFields - Array of client context fields to include in system prompt
 *
 * @returns StreamingResponse - Server-sent events stream with data types:
 *   - `content`: Streaming AI response content chunks
 *   - `image`:
 *   - `complete`: Final completion signal with chatId and optional newTitle
 *   - `error`: Error information with message details
 */
export const POST = withEnhancedApi(
  async ({userId, req}: ApiContext) => {
    let chatId: string = '';

    // Parse request body
    const {messages, chatId: requestChatId, model, clientId, contextFields} = await parseJsonBody(req)
    chatId = requestChatId;
    const selectedModel = model || getDefaultModel()
    const userLocale = await getLocaleFromCookies()

    // Validate model access based on user's subscription tier
    const modelAccessResult = await checkModelAccess(userId, selectedModel)
    if (!modelAccessResult) {
      throw new Error(SubscriptionErrorCode.MODEL_ACCESS_DENIED)
    }

    let chat: ChatWithMessages | null;

    // If it's first message (no chatId), create new chat, else, get chat with existing messages
    if (!chatId) {
      chat = await ChatService.createChat(userId, clientId || null, contextFields || [])
      chatId = chat.id
    } else {
      chat = await ChatService.getChatWithMessagesById(chatId, userId)
    }

    // get chat client data, if any
    const client = await ChatService.getClientFromChat(chat, userId)

    // Save the user message to the database
    const lastMessageContent = messages[messages.length - 1].content
    await MessageService.createMessage({
      content: lastMessageContent,
      role: Role.USER,
      model: selectedModel,
      cost_usd: 0,
      chat: { connect: { id: chatId } }
    }, userId)

    // If this is the first user message or chat title is default value, update chat title
    let newTitle: string | undefined
    const isFirstUserMessage = chat.messages.length === 0
    if (isFirstUserMessage || chat.title === NEW_CHAT_DEFAULT_TITLE) {
      newTitle = await ChatService.updateChatTitleWithFirstMessage(
        chatId,
        userId,
        client?.name || null,
        lastMessageContent
      )
      // Revalidate the chat page to show the updated title
      revalidatePath(`/assistant/chat/${chatId}`)
    }

    // Prepare all chat messages for OpenRouter request
    const formattedMessages = await ChatService.formatMessagesForOpenRouterRequest(chat, lastMessageContent, client, userLocale)

    // Create a streaming response
    const modalities = OpenRouterService.getModelModalities(selectedModel)
    const stream = new ReadableStream({
      async start(controller) {

        const safeEnqueue = (data: Uint8Array) => {
          try {
            controller.enqueue(data)
            return true
          } catch (error) {
            // Controller is closed/aborted - client disconnected
            return false
          }
        }

        const encoder = new TextEncoder()
        let fullContent = ''
        let collectedImages: any[] = []
        let completionStream: AsyncGenerator<StreamChunk, void, unknown> | null = null

        try {
          completionStream = openRouterService.createStreamingCompletion(
            {
              model: selectedModel, 
              messages: formattedMessages,
              modalities
            },
            {userId, resourceId: chatId}
          )

          for await (const chunk of completionStream) {
            // Handle images in the stream
            if (chunk.images && chunk.images.length > 0) {
              collectedImages.push(...chunk.images)
              
              // Stream image data to client
              const imageData = {
                type: 'images',
                images: chunk.images
              }
              
              if (!safeEnqueue(encoder.encode(`data: ${JSON.stringify(imageData)}\n\n`))) {
                logger.info('Client disconnected during image streaming', {userId, chatId});
                return
              }
            }
            
            if (chunk.isComplete) {
              // Final chunk - use cost from chunk (already fetched by OpenRouter service)
              const cost_usd = chunk.cost_usd || 0;
              const generationId = chunk.generationId;
              // Use collected images (chunk.images is not included in final chunk to avoid duplicates)
              const finalImages = collectedImages;

              // Save the assistant's response to the database with cost and images
              try {
                await MessageService.createMessage({
                  content: fullContent,
                  role: Role.ASSISTANT,
                  model: selectedModel,
                  cost_usd: cost_usd,
                  generation_id: generationId,
                  ...(finalImages.length > 0 && { images: finalImages }),
                  chat: { connect: { id: chatId } }
                }, userId);
              } catch (error) {
                logger.error('Failed to save assistant message', error as Error, { userId, chatId })
              }

              // Send completion signal, include chatId and newTitle for new chats
              const completionData = {
                type: 'complete',
                chatId: chatId,
                newTitle: newTitle
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
                  try {
                    await MessageService.createMessage({
                      content: fullContent,
                      role: Role.ASSISTANT,
                      model: selectedModel,
                      cost_usd: 0, // 0 cost for partial message
                      chat: { connect: { id: chatId } }
                    }, userId);
                    logger.info('Partial assistant message saved', {userId, chatId});
                  } catch (error) {
                    logger.error('Failed to save partial assistant message', error as Error, { userId, chatId })
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
    requireUsageCheck: true
  })