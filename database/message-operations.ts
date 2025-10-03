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
   * Mark a message as inactive (soft delete)
   */
  static async markMessageAsInactive(messageId: string, userId: string): Promise<DbOperationResult<Message>> {
    try {
      // First verify the message exists and user owns the chat
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { chat: true }
      })

      if (!message) {
        return {
          success: false,
          error: 'Message not found'
        }
      }

      // Verify ownership
      if (message.chat.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized: Message does not belong to user'
        }
      }

      // Mark as inactive
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { isActive: false }
      })

      return {
        success: true,
        data: updatedMessage
      }
    } catch (error) {
      console.error('Error marking message as inactive:', error)
      return {
        success: false,
        error: 'Failed to mark message as inactive'
      }
    }
  }

}