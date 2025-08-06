/**
 * Message-specific database operations
 */

import {prisma} from '@/lib/prisma'
import {Chat, Message, Prisma} from '@prisma/client'
import {BaseOperations} from './base-operations'
import {DbOperationResult} from '@/lib/types/database-types'

export class MessageOperations extends BaseOperations {
  /**
   * Create a new message
   */
  static async createMessage(data: Prisma.MessageCreateInput): Promise<DbOperationResult<Message>> {
    try {
      const message = await prisma.message.create({
        data,
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
  static async findUserChat(chatId: string, userId: string): Promise<DbOperationResult<Chat>> {
    return this.findUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      { context: 'Find user chat for message creation' }
    )
  }

  /**
   * Update message token information with ownership verification
   */
  static async updateMessageTokens(messageId: string, userId: string, tokenData: {
    inputTokens?: number,
    tokensUsed?: number,
    outputTokens?: number
  }): Promise<DbOperationResult<Message>> {
    try {
      // First verify the message belongs to a user-owned chat
      const message = await prisma.message.findFirst({
        where: { id: messageId },
        include: { chat: true }
      })

      if (!message || message.chat.userId !== userId) {
        return {
          success: false as const,
          error: 'Message not found or access denied'
        }
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          inputTokens: tokenData.inputTokens ?? message.inputTokens,
          tokensUsed: tokenData.tokensUsed ?? message.tokensUsed,
          outputTokens: tokenData.outputTokens ?? message.outputTokens
        }
      })

      return {
        success: true as const,
        data: updatedMessage
      }
    } catch (error) {
      console.error('Error updating message tokens:', error)
      return {
        success: false as const,
        error: 'Failed to update message tokens'
      }
    }
  }
}