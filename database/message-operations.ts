/**
 * Message-specific database operations
 */

import { prisma } from '@/lib/prisma'
import { BaseOperations } from './base-operations'
import {DbOperationConfig} from "@/lib/types/database-types";

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

  /**
   * Update message token information with ownership verification
   */
  static async updateMessageTokens(messageId: string, userId: string, tokenData: {
    inputTokens?: number,
    tokensUsed?: number,
    outputTokens?: number
  }) {
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