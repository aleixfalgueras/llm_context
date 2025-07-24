/**
 * Message-specific database operations
 */

import { prisma } from '../prisma'
import { BaseOperations, DbOperationConfig } from './base-operations'

export class MessageOperations extends BaseOperations {
  /**
   * Create a new message
   */
  static async createMessage(
    chatId: string,
    content: string,
    role: 'USER' | 'ASSISTANT',
    model?: string,
    tokensUsed?: number,
    inputTokens?: number,
    outputTokens?: number
  ) {
    try {
      const message = await prisma.message.create({
        data: {
          content,
          role,
          model,
          tokensUsed: tokensUsed || 0,
          inputTokens: inputTokens || 0,
          outputTokens: outputTokens || 0,
          chatId,
        },
      })

      return {
        success: true,
        data: message
      }
    } catch (error) {
      console.error('Error creating message:', error)
      return {
        success: false,
        error: 'Failed to create message'
      }
    }
  }

  /**
   * Find chat with ownership verification
   */
  static async findUserChat(chatId: string, userId: string) {
    return this.findUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      { context: 'Find user chat for message creation' }
    )
  }

  /**
   * Get messages for a chat with ownership verification
   */
  static async getChatMessages(chatId: string, userId: string) {
    try {
      // First verify chat ownership
      const chatResult = await this.findUserChat(chatId, userId)
      if (!chatResult.success) {
        return chatResult
      }

      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' }
      })

      return {
        success: true,
        data: messages
      }
    } catch (error) {
      console.error('Error getting chat messages:', error)
      return {
        success: false,
        error: 'Failed to get chat messages'
      }
    }
  }
}