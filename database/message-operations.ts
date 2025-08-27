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

}