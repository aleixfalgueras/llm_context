import {ChatOperations} from '@/database'
import {isSuccess} from '@/database/base-operations'
import {buildClientContextSection, hasClientContext} from '@/services/client/client-context-service'
import {ClientService} from '@/services/client/client-service'
import {logger} from '@/lib/logger'
import {Chat, Client, Message, Role} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {MessageContent, OpenRouterMessage} from '@/lib/types/openrouter-types'
import {ChatWithMessages} from "@/lib/types/chat-types";
import {getTranslations, Locale} from '@/lib/translations'
import {parseMessageImages} from '@/lib/utils/chat-utils'


export const NEW_CHAT_DEFAULT_TITLE = 'New Chat'

export class ChatService {

  /**
   * Delete a chat with ownership verification
   */
  static async deleteChat(chatId: string, userId: string): Promise<DbOperationResult<{ id: string }>> {
    return ChatOperations.deleteChat(chatId, userId)
  }

  /**
   * Delete all chats for a user
   */
  static async deleteAllUserChats(userId: string): Promise<DbOperationResult<{ deletedCount: number }>> {
    return ChatOperations.deleteAllUserChats(userId)
  }

  /**
   * Update chat title with ownership verification
   */
  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<DbOperationResult<Chat>> {
    return ChatOperations.updateChatTitle(chatId, userId, title)
  }

  /**
   * Build system prompt: general-purpose AI assistant or marketing assistant with optional client context
   * Fetches necessary translations internally based on the provided locale
   * 
   * @param client - Client object or null for general-purpose assistant
   * @param selectedContextFields - Array of client context fields to include
   * @param locale - User's selected locale for translations
   * @returns System prompt string with appropriate context and instructions
   */
  static async buildSystemPrompt(client: any | null, selectedContextFields: string[], locale: Locale = 'en'): Promise<string> {
    // Fetch translations needed for building the system prompt
    const tContext = await getTranslations('clientContext', locale)
    const tPrompts = await getTranslations('aiPrompts', locale)
    
    if (!client) {
      // general-purpose assistant
      return tPrompts('chat.generalAssistant')
    }

    const hasContextData = hasClientContext(selectedContextFields, tContext)

    // marketing assistant with optional client context
    const marketingAssistant = tPrompts('chat.marketingAssistant')
    const withContextOrEmpty = hasContextData ? ` ${tPrompts('chat.withContext')}` : ''
    const contextSection = buildClientContextSection(client, selectedContextFields, tContext)
    
    const instructions = hasContextData ? 
      tPrompts('chat.instructions.withContext') : tPrompts('chat.instructions.general')
    
    const referenceInstruction = hasContextData ?
      tPrompts('chat.instructions.referenceContext') : tPrompts('chat.instructions.keepBroad')
    
    const professionalContext = tPrompts('chat.professionalContext')

    return `
${marketingAssistant}${withContextOrEmpty}

${contextSection}

INSTRUCTIONS:
- ${instructions}
- ${referenceInstruction}
- ${professionalContext}
`.trim()
  }

  /**
   * Process new chat creation with optional client
   */
  static async createChat(userId: string,
                          clientId: string | null = null,
                          contextFields: string[] = []): Promise<ChatWithMessages> {

    // All new chats start with a generic title - will be updated when first message is sent
    const result = await ChatOperations.createChat(userId, clientId, NEW_CHAT_DEFAULT_TITLE, contextFields)

    if (!isSuccess(result)) {
      logger.error(result.error)
      throw new Error(result.error)
    }

    return result.data

  }

  /**
   * Get user chat with messages using chatId
   */
  static async getChatWithMessagesById(chatId: string, userId: string): Promise<ChatWithMessages> {
    const result = await ChatOperations.getChatWithMessagesById(chatId, userId)

    if (!isSuccess(result)) {
      logger.error(result.error);
      throw new Error(result.error)
    }

    return result.data

  }

  /**
   * Get client from chat if it has one
   * 
   * @param chat - Chat object with optional clientId
   * @param userId - User ID for authorization
   * @returns Client object or null if chat has no client or client not found
   */
  static async getClientFromChat(chat: ChatWithMessages, userId: string): Promise<Client | null> {
    if (!chat.clientId) {
      return null
    }

    const clientResult = await ClientService.getUserClientById(chat.clientId, userId)
    if (!clientResult.success) {
      // Log warning but don't fail - chat might not have a client
      logger.warn('Client not found for chat', {chatId: chat.id, clientId: chat.clientId})
      return null
    }

    return clientResult.data
  }

  /**
   * Format chat messages (existing, new, and system prompt) for OpenRotuer request
   *
   * @param chat - Chat object with messages and optional client context
   * @param newMessageContent - New message content to add
   * @param locale - User's selected locale for prompts
   * @param client - Client object or null if chat has no client
   * @returns Formatted messages array with system prompt and optional client context
   */
  static async formatMessagesForOpenRouterRequest(chat: ChatWithMessages,
                                                  newMessageContent: string,
                                                  client: Client | null,
                                                  locale: Locale = 'en'): Promise<OpenRouterMessage[]> {
    const existingMessages = chat.messages

    // Format existing messages for OpenRouter, text content only
    const openRouterMessages: OpenRouterMessage[] = existingMessages.map((msg: Message) => {
      const role = msg.role === Role.USER ? 'user' as const : 'assistant' as const
      return {role, content: msg.content}

      /* image messages formatting code - disabled for now
      const parsedImages = parseMessageImages(msg.images)

      if (parsedImages && parsedImages.length > 0) {
        const messagesContentArray: MessageContent[] = [] // Create content array with text first, then images
        // console.debug(parsedImages[0].image_url.url.substring(0, 100))
        // Add text message content if present
        if (msg.content) {
          messagesContentArray.push({type: 'text', text: msg.content})
        }

        messagesContentArray.push(...parsedImages) // Add images - they're already in ImageMessageContent format

        return {role, content: messagesContentArray}
       */
    })

    // Add the new user message
    openRouterMessages.push({
      role: 'user' as const,
      content: newMessageContent,
    })

    // Build system prompt with or without client, and if with client, with proper client context
    const systemPrompt = await this.buildSystemPrompt(client, chat.contextFields || [], locale)

    // Add system message
    openRouterMessages.unshift({
      role: 'system',
      content: systemPrompt,
    })

    // console.debug(openRouterMessages)

    return openRouterMessages

  }

  /**
   * Update chat title for first message
   */
  static async updateChatTitleWithFirstMessage(
    chatId: string,
    userId: string,
    clientName: string | null,
    firstMessageContent: string): Promise<string> {
    let newTitle: string

    // Generate title based on client name (if any) and first message content
    if (clientName && firstMessageContent) {
      newTitle = `${clientName} - ${firstMessageContent.replace(/\n+/g, ' ')}`
    } else if (firstMessageContent) {
      newTitle = firstMessageContent.replace(/\n+/g, ' ')
    } else {
      // fallback case
      newTitle = `Chat ${new Date().toLocaleDateString()}`
    }

    const newTitleTruncated = newTitle.length < 70 ? newTitle : `${newTitle.substring(0, 70)}...`
    const result = await ChatOperations.updateChatTitle(chatId, userId, newTitleTruncated)

    if (!isSuccess(result)) {
      logger.error(`Failed to update chat title: ${result.error}`)
      throw new Error(result.error)
    }

    return newTitle
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(userId: string): Promise<DbOperationResult<Chat[]>> {
    return ChatOperations.getAllUserChats(userId)
  }

}
