import {StreamingMessageService} from '@/services/chat/streaming-message-service'
import {ChatService, NEW_CHAT_DEFAULT_TITLE} from '@/services/chat/chat-service'
import {revalidatePath} from 'next/cache'
import {openRouterService, OpenRouterService} from '@/services/openrouter'
import {logger} from '@/lib/logger'
import {checkModelAccess} from "@/lib/api/api-validation";
import {ApiContext, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {SubscriptionErrorCode} from "@/services/error-codes";
import {getLocaleFromCookies} from '@/lib/utils/locale-cookie-server'
import {ChatWithMessages} from "@/lib/types/chat-types";
import {chatStreamingService} from '@/services/chat/chat-streaming-service'
import {StreamingResponseConfig} from '@/lib/types/streaming-types'
import {getDefaultModel} from "@/lib/utils/model-utils";

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
    const {messages, chatId: requestChatId, model, clientId, contextFields, webSearch, isRegeneration} = await parseJsonBody(req)
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

    // saves user message to database (skip if regenerating - message already exists)
    const lastMessageContent = messages[messages.length - 1].content
    if (!isRegeneration) {
      const userMessageResult = await StreamingMessageService.saveUserMessage(
        chatId,
        userId,
        lastMessageContent,
        selectedModel
      )

      if (!userMessageResult.success) {
        logger.error('Failed to save user message', new Error(userMessageResult.error), { userId, chatId })
        throw new Error('Failed to save user message')
      }
    }

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

    // Create streaming response configuration
    const streamingConfig: StreamingResponseConfig = {chatId, userId, selectedModel, clientId, newTitle, webSearch}

    // Create streaming response with new abstraction
    const modalities = OpenRouterService.getModelModalities(selectedModel)
    return await chatStreamingService.createStreamingResponseWithRetry(
      streamingConfig,
      () => openRouterService.createStreamingCompletion(
        {
          model: selectedModel,
          messages: formattedMessages,
          modalities,
          webSearch
        },
        {userId, resourceId: chatId}
      )
    )
  },
  {
    context: 'Chat API',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireUsageCheck: true
  })