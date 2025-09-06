import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {Chat, Message} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {ChatWithMessages} from "@/lib/types/chat-types";

export class ChatOperations extends BaseOperations {
  /**
   * Delete a single chat with ownership verification
   */
  static async deleteChat(chatId: string, userId: string): Promise<DbOperationResult<{ id: string }>> {
    return this.deleteUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      {context: 'Delete chat'}
    )
  }

  /**
   * Update chat title with ownership verification
   */
  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<DbOperationResult<Chat>> {
    return this.updateUserOwnedRecord(
      prisma.chat,
      chatId,
      userId,
      {title},
      {context: 'Update chat title'}
    )
  }

  /**
   * Alternative method for deleting all user chats using deleteMany
   * This is more efficient than bulk delete for this specific case
   */
  static async deleteAllUserChats(userId: string): Promise<DbOperationResult<{ deletedCount: number }>> {
    try {
      const result = await prisma.chat.deleteMany({
        where: {userId}
      })

      return {
        success: true,
        data: {deletedCount: result.count}
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
   * Create a new chat with optional client validation
   */
  static async createChat(userId: string, clientId: string | null, title: string, contextFields: string[] = []): Promise<DbOperationResult<ChatWithMessages>> {
    try {
      // If clientId provided, verify client exists and belongs to user
      if (clientId) {
        const clientExists = await prisma.client.findFirst({
          where: {
            id: clientId,
            userId
          },
          select: {id: true}
        })

        if (!clientExists) {
          return {
            success: false as const,
            error: 'Client not found'
          }
        }
      }

      // Create new chat
      const chat = await prisma.chat.create({
        data: {
          title,
          userId,
          clientId,
          contextFields: clientId ? contextFields : [], // Only save context fields if there's a client
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
        data: chat
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return {
        success: false as const,
        error: 'Failed to create chat'
      }
    }
  }

  /**
   * Get existing user chat with messages using chatId
   */
  static async getChatWithMessagesById(chatId: string, userId: string): Promise<DbOperationResult<Chat & {
    messages: Message[]
  }>> {
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
   * Get all chats for a user
   */
  static async getAllUserChats(userId: string): Promise<DbOperationResult<Chat[]>> {
    try {
      const chats = await prisma.chat.findMany({
        where: {userId},
        orderBy: {updatedAt: 'desc'}
      })

      return {
        success: true as const,
        data: chats
      }
    } catch (error) {
      console.error('Error getting user chats:', error)
      return {
        success: false as const,
        error: 'Failed to retrieve chats'
      }
    }
  }
}