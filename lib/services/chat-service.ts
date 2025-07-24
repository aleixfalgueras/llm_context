/**
 * Chat business logic service
 * Pure business logic without Next.js dependencies
 */

import { ChatOperations } from '../database'

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
}