/**
 * Chat business logic service
 * Pure business logic without Next.js dependencies
 */

import { ChatOperations } from '../database'
import { isSuccess, unwrapResult } from '@/database/base-operations'
import { generateChatTitleWithClient } from '../lib/utils/general'
import { buildClientContextSection, hasClientContext } from './client-context-service'
import { getDefaultModel, getModelsByTier } from '../lib/ai/models-config'
import { checkModelAccess, withClientAccess } from '../lib/middleware/validation-middleware'
import { logger } from '../lib/logger'
import {SubscriptionErrorCode} from "@/lib/api/api-error-codes";

export class ChatService {
  /**
   * Delete a chat with ownership verification
   */
  static async deleteChat(chatId: string, userId: string) {
    return ChatOperations.deleteChat(chatId, userId)
  }

  /**
   * Delete all chats for a user
   */
  static async deleteAllUserChats(userId: string) {
    return ChatOperations.deleteAllUserChats(userId)
  }

  /**
   * Update chat title with ownership verification
   */
  static async updateChatTitle(chatId: string, userId: string, title: string) {
    return ChatOperations.updateChatTitle(chatId, userId, title)
  }

  /**
   * Validate model access for a user
   */
  static async validateModelAccess(userId: string, selectedModel: string, chatId?: string) {
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

      return {
        success: false as const,
        error: `Your ${modelAccess.plan} plan doesn't include access to this model. Available models: ${modelNames}`,
        code: SubscriptionErrorCode.MODEL_ACCESS_DENIED,
        status: 403,
        metadata: {
          tier: modelAccess.tier,
          plan: modelAccess.plan,
          modelId: selectedModel,
          upgradeUrl: '/subscription'
        }
      }
    }

    return {
      success: true as const,
      data: modelAccess
    }
  }

  /**
   * Build system prompt with client context
   */
  static buildSystemPrompt(client: any, selectedContextFields: string[]) {
    const clientContextSection = buildClientContextSection(client, selectedContextFields)
    const hasContextData = hasClientContext(selectedContextFields)

    return `You are a professional AI assistant helping a marketing service provider with their business.${hasContextData ? ' You have access to the following client information and should use it to provide personalized, relevant advice and responses.' : ''}${clientContextSection}

INSTRUCTIONS:
- ${hasContextData ? 'Use this client information to personalize your responses when relevant' : 'Provide helpful general business advice'}
- ${hasContextData ? 'Reference their specific circumstances when it adds value to your response' : 'Keep responses broadly applicable but actionable'}
- Be professional, knowledgeable, and supportive
- Help with any aspect of marketing business operations: strategy, client management, content creation, campaigns, analysis, operations, industry insights, problem-solving, etc.
- Provide practical, actionable advice tailored to marketing professionals
- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`
  }

  /**
   * Process new chat creation
   */
  static async processNewChat(userId: string, clientId: string, contextFields: string[] = []) {
    if (!clientId) {
      logger.warn('Chat creation attempted without client ID', { userId });
      return {
        success: false as const,
        error: 'Client selection is required for new chat'
      }
    }

    const chatTitle = generateChatTitleWithClient('')
    const result = await ChatOperations.createChatWithClient(userId, clientId, chatTitle, contextFields)
    
    if (!isSuccess(result)) {
      logger.warn('Client not found for chat creation', { userId, clientId });
      return result
    }

    const { chat, client } = result.data
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
      metadata: { title: actualTitle, contextFieldCount: contextFields.length }
    });

    return {
      success: true as const,
      data: { chat, client }
    }
  }

  /**
   * Process existing chat retrieval
   */
  static async processExistingChat(chatId: string, userId: string) {
    const result = await ChatOperations.getChatWithMessages(chatId, userId)
    
    if (!isSuccess(result)) {
      logger.warn('Chat not found', { userId, chatId });
      return result
    }

    return {
      success: true as const,
      data: result.data
    }
  }

  /**
   * Prepare chat data for AI processing
   */
  static async prepareChatForAI(chat: any, userId: string, newMessageContent: string) {
    const existingMessages = chat.messages
    const isFirstUserMessage = existingMessages.length === 0

    // Format existing messages for AI provider
    const aiMessages: Array<{
      role: 'system' | 'user' | 'assistant',
      content: string
    }> = existingMessages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // Get client information for this chat
    const client = await withClientAccess(userId, chat.clientId)

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
  static async updateChatTitleForFirstMessage(chatId: string, userId: string, clientName: string, isFirstMessage: boolean, currentTitle: string) {
    if (isFirstMessage && currentTitle === 'New Chat') {
      const newTitle = generateChatTitleWithClient(clientName)
      
      const result = await ChatOperations.updateChatTitleIfDefault(chatId, userId, newTitle)
      
      if (isSuccess(result) && result.data.updated) {
        logger.info('Chat title updated', {
          userId,
          chatId,
          metadata: { newTitle }
        });
        
        return {
          success: true as const,
          data: { newTitle, updated: true }
        }
      }
    }

    return {
      success: true as const,
      data: { updated: false }
    }
  }
}