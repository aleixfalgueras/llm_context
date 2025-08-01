/**
 * Chat-specific database operations
 */

import { prisma } from '../lib/prisma'
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

  /**
   * Create a new chat with client validation
   */
  static async createChatWithClient(userId: string, clientId: string, title: string, contextFields: string[] = []) {
    try {
      // Verify client exists and belongs to user
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId
        },
        select: { name: true }
      })

      if (!client) {
        return {
          success: false as const,
          error: 'Client not found'
        }
      }

      // Create new chat
      const chat = await prisma.chat.create({
        data: {
          title,
          userId,
          clientId,
          contextFields,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      return {
        success: true as const,
        data: { chat, client }
      }
    } catch (error) {
      console.error('Error creating chat with client:', error)
      return {
        success: false as const,
        error: 'Failed to create chat'
      }
    }
  }

  /**
   * Get existing chat with messages
   */
  static async getChatWithMessages(chatId: string, userId: string) {
    try {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!chat) {
        return {
          success: false as const,
          error: 'Chat not found'
        }
      }

      return {
        success: true as const,
        data: chat
      }
    } catch (error) {
      console.error('Error getting chat with messages:', error)
      return {
        success: false as const,
        error: 'Failed to retrieve chat'
      }
    }
  }

  /**
   * Update chat title if it matches the default title
   */
  static async updateChatTitleIfDefault(chatId: string, userId: string, newTitle: string, defaultTitle: string = 'New Chat') {
    try {
      const result = await prisma.chat.updateMany({
        where: {
          id: chatId,
          userId,
          title: defaultTitle
        },
        data: {
          title: newTitle
        }
      })

      return {
        success: true as const,
        data: { updated: result.count > 0 }
      }
    } catch (error) {
      console.error('Error updating chat title:', error)
      return {
        success: false as const,
        error: 'Failed to update chat title'
      }
    }
  }
}