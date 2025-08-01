/**
 * Message business logic service
 * Pure business logic without Next.js dependencies
 */

import { MessageOperations } from '../database'
import { logger, withTiming } from '../lib/logger'

export class MessageService {
  /**
   * Create a message with chat ownership verification
   */
  static async createMessage(
    chatId: string,
    userId: string,
    content: string,
    role: 'USER' | 'ASSISTANT',
    model?: string,
    tokensUsed?: number,
    inputTokens?: number,
    outputTokens?: number
  ) {
    const endTiming = logger.startTiming('Create Message Service');
    
    try {
      logger.userAction('Create message', { 
        userId, 
        chatId,
        metadata: { role, contentLength: content.length, model, tokensUsed, inputTokens, outputTokens }
      });

      // Verify the chat belongs to the user
      const chatResult = await MessageOperations.findUserChat(chatId, userId)

      if (!chatResult.success) {
        logger.warn('Chat not found for message creation', { userId, chatId });
        endTiming();
        return {
          success: false,
          error: 'Chat not found or access denied'
        }
      }

      // Create the message
      const messageResult = await withTiming(
        'Create message in DB',
        () => MessageOperations.createMessage(chatId, content, role, model, tokensUsed, inputTokens, outputTokens),
        { userId, chatId }
      );

      endTiming();
      return messageResult;
    } catch (error) {
      logger.error('Error creating message', error as Error, { userId, chatId });
      endTiming();
      return {
        success: false,
        error: 'Failed to create message'
      }
    }
  }

  /**
   * Get messages for a chat with ownership verification
   */
  static async getChatMessages(chatId: string, userId: string) {
    return MessageOperations.getChatMessages(chatId, userId)
  }

  /**
   * Update message token information with ownership verification
   */
  static async updateMessageTokens(messageId: string, userId: string, tokenData: {
    inputTokens?: number,
    tokensUsed?: number,
    outputTokens?: number
  }) {
    const endTiming = logger.startTiming('Update Message Tokens Service');
    
    try {
      logger.userAction('Update message tokens', { 
        userId,
        metadata: { tokenData, messageId }
      });

      const result = await withTiming(
        'Update message tokens in DB',
        () => MessageOperations.updateMessageTokens(messageId, userId, tokenData),
        { userId, metadata: { messageId }}
      );

      endTiming();
      return result;
    } catch (error) {
      logger.error('Error updating message tokens', error as Error, { userId, metadata: { messageId } });
      endTiming();
      return {
        success: false as const,
        error: 'Failed to update message tokens'
      }
    }
  }
}