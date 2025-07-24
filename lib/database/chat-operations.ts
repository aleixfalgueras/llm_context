/**
 * Chat-specific database operations
 */

import { prisma } from '../prisma'
import { BaseOperations } from './base-operations'

export class ChatOperations extends BaseOperations {
  /**
   * Delete a single chat with ownership verification
   */
  static async deleteChat(chatId: string, userId: string) {
    return this.deleteUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      { context: 'Delete chat' }
    )
  }

  /**
   * Update chat title with ownership verification
   */
  static async updateChatTitle(chatId: string, userId: string, title: string) {
    return this.updateUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      { title },
      { context: 'Update chat title' }
    )
  }

  /**
   * Alternative method for deleting all user chats using deleteMany
   * This is more efficient than bulk delete for this specific case
   */
  static async deleteAllUserChats(userId: string) {
    try {
      const result = await prisma.chat.deleteMany({
        where: { userId }
      })

      return {
        success: true,
        data: { deletedCount: result.count }
      }
    } catch (error) {
      console.error('Error deleting all user chats:', error)
      return {
        success: false,
        error: 'Failed to delete all chats'
      }
    }
  }
}