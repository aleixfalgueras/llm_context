import {ChatOperations} from '@/database'
import {isSuccess} from '@/database/base-operations'
import {generateChatTitleWithClient} from '@/lib/utils/general'
import {buildClientContextSection, hasClientContext} from './client-context-service'
import {ClientService} from './client-service'
import {logger} from '@/lib/logger'
import {Chat, Client, Message, Role} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {AIMessageRole} from '@/lib/ai/openrouter/client'

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
   * Build system prompt with client context
   */
  static buildSystemPrompt(client: any, selectedContextFields: string[]): string {
    const clientContextSection = buildClientContextSection(client, selectedContextFields)
    const hasContextData = hasClientContext(selectedContextFields)

    return `You are a professional AI assistant helping a marketing service provider with their business.${
      hasContextData 
        ? ' You have access to the following client information and should use it to provide personalized, relevant advice and responses.' 
        : ''
    }${clientContextSection}

INSTRUCTIONS:
	- ${
      hasContextData 
        ? 'Use this client information to personalize your responses when relevant' 
        : 'Provide helpful general business advice'
    }
	- ${
      hasContextData 
        ? 'Reference their specific circumstances when it adds value to your response' 
        : 'Keep responses broadly applicable but actionable'
    }
	- Be professional, knowledgeable, and supportive
	- Help with any aspect of marketing business operations: 
		• Strategy and planning
		• Client management
		• Content creation
		• Campaigns and analysis
		• Operations and workflows
		• Industry insights
		• Problem-solving and optimization
	- Provide practical, actionable advice tailored to marketing professionals
	- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`
  }

  /**
   * Process new chat creation
   */
  static async createNewChat(userId: string, clientId: string, contextFields: string[] = []): Promise<DbOperationResult<{
    chat: Chat & { messages: Message[] },
    client: Pick<Client, 'name'>
  }>> {
    if (!clientId) {
      logger.warn('Chat creation attempted without client ID', {userId});
      return {
        success: false as const,
        error: 'Client selection is required for new chat'
      }
    }

    const chatTitle = generateChatTitleWithClient('')
    const result = await ChatOperations.createChatWithClient(userId, clientId, chatTitle, contextFields)

    if (!isSuccess(result)) {
      logger.warn('Client not found for chat creation', {userId, clientId});
      return result
    }

    const {chat, client} = result.data
    const actualTitle = generateChatTitleWithClient(client.name)

    // Update title with actual client name
    if (actualTitle !== chatTitle) {
      const updateResult = await ChatOperations.updateChatTitle(chat.id, userId, actualTitle)
      if (isSuccess(updateResult)) {
        chat.title = actualTitle
      }
      // Note: We don't fail the entire operation if title update fails, just log it
    }

    logger.info('New chat created', {
      userId,
      chatId: chat.id,
      clientId,
      metadata: {title: actualTitle, contextFieldCount: contextFields.length}
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
   * @param chat - Chat object with messages and client context
   * @param userId - User ID for ownership verification
   * @param newMessageContent - New message content to add
   * @returns Formatted messages array with system prompt and client context
   */
  static async prepareChatForAI(chat: any, userId: string, newMessageContent: string): Promise<DbOperationResult<{
    aiMessages: Array<{ role: AIMessageRole, content: string }>,
    client: Client,
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

    // Get client information for this chat
    const clientResult = await ClientService.getUserClientById(chat.clientId, userId)
    if (!clientResult.success) {
      throw new Error(clientResult.error || 'Client not found')
    }
    const client = clientResult.data

    // Build system prompt with client context
    const selectedContextFields = chat.contextFields || []
    const systemPrompt = this.buildSystemPrompt(client, selectedContextFields)

    logger.info('System prompt created for chat', {
      userId,
      chatId: chat.id,
      clientId: client.id,
      metadata: {
        systemPrompt,
        promptLength: systemPrompt.length,
        hasClientContext: hasClientContext(selectedContextFields),
        contextFields: selectedContextFields,
        clientName: client.name,
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
  static async updateChatTitleForFirstMessage(chatId: string, userId: string, clientName: string, isFirstMessage: boolean, currentTitle: string): Promise<DbOperationResult<{
    newTitle?: string,
    updated: boolean
  }>> {
    if (isFirstMessage && currentTitle === 'New Chat') {
      const newTitle = generateChatTitleWithClient(clientName)

      const result = await ChatOperations.updateChatTitleIfDefault(chatId, userId, newTitle)

      if (isSuccess(result) && result.data.updated) {
        logger.info('Chat title updated', {
          userId,
          chatId,
          metadata: {newTitle}
        });

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