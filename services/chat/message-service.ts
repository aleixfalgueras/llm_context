import {MessageOperations} from '@/database'
import {logger} from '@/lib/logger'
import {Message, Prisma} from '@prisma/client'

export class MessageService {
  /**
   * Create a message with chat ownership verification
   */
  static async createMessage(
    data: Prisma.MessageCreateInput,
    userId: string
  ): Promise<Message> {
    try {
      // Extract chatId from the data for ownership verification
      const chatId = typeof data.chat === 'object' && 'connect' in data.chat && data.chat.connect
        ? data.chat.connect.id 
        : '';

      if (!chatId) {
        throw new Error('Invalid chat connection data')
      }

      // Verify the chat belongs to the user
      const chatResult = await MessageOperations.findUserChat(chatId, userId)

      if (!chatResult.success) {
        logger.warn('Chat not found for message creation', { userId, chatId });
        throw new Error('Chat not found or access denied')
      }

      const result = await MessageOperations.createMessage(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create message')
      }
      
      return result.data;
    } catch (error) {
      logger.error('Error creating message', error as Error, { userId });
      throw error;
    }
  }

}