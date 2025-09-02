import {ChatOperations} from '@/database'
import {isSuccess} from '@/database/base-operations'
import {buildClientContextSection, hasClientContext} from './client/client-context-service'
import {ClientService} from './client/client-service'
import {logger} from '@/lib/logger'
import {Chat, Client, Message, Role} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {AIMessageRole} from '@/lib/types/openrouter-types'
import {ChatWithMessages} from "@/lib/types/chat-types";
import {getTranslations, TranslationFunction, Locale} from '@/lib/translations'


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
   */
  static buildSystemPrompt(client: any | null, selectedContextFields: string[], tContext: TranslationFunction, tPrompts: TranslationFunction): string {
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
  static async createNewChat(userId: string, clientId: string | null = null, contextFields: string[] = []): Promise<DbOperationResult<{
    chat: ChatWithMessages,
    client: Pick<Client, 'name'> | null
  }>> {
    // All new chats start with a generic title - will be updated when first message is sent
    const chatTitle = 'New Chat'
    const result = await ChatOperations.createChat(userId, clientId, chatTitle, contextFields)

    if (!isSuccess(result)) {
      logger.warn('Failed to create chat', {userId, clientId: clientId || undefined});
      return result
    }

    const {chat, client} = result.data

    logger.info('New chat created', {
      userId,
      chatId: chat.id,
      clientId: clientId || undefined,
      metadata: {title: chat.title, contextFieldCount: contextFields.length, hasClient: !!client}
    });

    return {
      success: true as const,
      data: {chat, client}
    }
  }

  /**
   * Get user chat with messages using chatId
   */
  static async getChatWithMessagesById(chatId: string, userId: string): Promise<DbOperationResult<Chat & {
    messages: Message[]
  }>> {
    const result = await ChatOperations.getChatWithMessagesById(chatId, userId)

    if (!isSuccess(result)) {
      logger.warn('Chat not found', {userId, chatId});
      return result
    }

    return {
      success: true as const,
      data: result.data
    }
  }

  /**
   * Prepare chat data for AI processing
   *
   * @param chat - Chat object with messages and optional client context
   * @param userId - User ID for ownership verification
   * @param newMessageContent - New message content to add
   * @param locale - User's selected locale for prompts
   * @returns Formatted messages array with system prompt and optional client context
   */
  static async prepareChatForAI(chat: any, userId: string, newMessageContent: string, locale: Locale = 'en'): Promise<DbOperationResult<{
    aiMessages: Array<{ role: AIMessageRole, content: string }>,
    client: Client | null,
    isFirstUserMessage: boolean,
    selectedContextFields: string[]
  }>> {
    const existingMessages = chat.messages
    const isFirstUserMessage = existingMessages.length === 0

    // Format existing messages for AI provider
    const aiMessages: Array<{
      role: AIMessageRole,
      content: string
    }> = existingMessages.map((msg: any) => ({
      role: msg.role === Role.USER ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }))

    // Get client information for this chat (if it has a client)
    let client: Client | null = null
    if (chat.clientId) {
      const clientResult = await ClientService.getUserClientById(chat.clientId, userId)
      if (!clientResult.success) {
        // Log warning but don't fail - chat might not have a client
        logger.warn('Client not found for chat', {chatId: chat.id, clientId: chat.clientId || undefined})
      } else {
        client = clientResult.data
      }
    }

    // Build system prompt with or without client context
    const selectedContextFields = chat.contextFields || []
    const tContext = await getTranslations('clientContext', locale)
    const tPrompts = await getTranslations('aiPrompts', locale)
    const systemPrompt = this.buildSystemPrompt(client, selectedContextFields, tContext, tPrompts)

    logger.info(`System prompt created for chat`, {
      userId,
      chatId: chat.id,
      clientId: chat.clientId || undefined,
      metadata: {
        systemPrompt,
        hasClient: !!client,
        hasClientContext: hasClientContext(selectedContextFields, tContext),
        contextFields: selectedContextFields,
        clientName: client?.name || 'N/A',
        isFirstMessage: isFirstUserMessage
      }
    });

    // Add system message
    aiMessages.unshift({
      role: 'system',
      content: systemPrompt,
    })

    // Add the new user message
    aiMessages.push({
      role: 'user' as const,
      content: newMessageContent,
    })

    return {
      success: true as const,
      data: {
        aiMessages,
        client,
        isFirstUserMessage,
        selectedContextFields
      }
    }
  }

  /**
   * Update chat title for first message if still default
   */
  static async updateChatTitleForFirstMessage(
    chatId: string,
    userId: string,
    clientName: string | null,
    isFirstMessage: boolean,
    currentTitle: string,
    firstMessageContent: string): Promise<DbOperationResult<{ newTitle?: string, updated: boolean
  }>> {
    if (isFirstMessage || currentTitle === 'New Chat') {
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
      const result = await ChatOperations.updateChatTitleIfDefault(chatId, userId, newTitleTruncated)

      if (isSuccess(result) && result.data.updated) {
        return {
          success: true as const,
          data: {newTitle, updated: true}
        }
      }
    }

    return {
      success: true as const,
      data: {updated: false}
    }
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(userId: string): Promise<DbOperationResult<Chat[]>> {
    return ChatOperations.getAllUserChats(userId)
  }

}
