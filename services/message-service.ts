import {MessageOperations} from '@/database'
import {logger} from '@/lib/logger'
import {Message, Prisma} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'

export class MessageService {
  /**
   * Create a message with chat ownership verification
   */
  static async createMessage(
    data: Prisma.MessageCreateInput,
    userId: string
  ): Promise<DbOperationResult<Message>> {
    try {
      // Extract chatId from the data for ownership verification
      const chatId = typeof data.chat === 'object' && 'connect' in data.chat && data.chat.connect
        ? data.chat.connect.id 
        : '';

      if (!chatId) {
        return {
          success: false,
          error: 'Invalid chat connection data'
        }
      }

      // Verify the chat belongs to the user
      const chatResult = await MessageOperations.findUserChat(chatId, userId)

      if (!chatResult.success) {
        logger.warn('Chat not found for message creation', { userId, chatId });
        return {
          success: false,
          error: 'Chat not found or access denied'
        }
      }

      return await MessageOperations.createMessage(data);
    } catch (error) {
      logger.error('Error creating message', error as Error, { userId });
      return {
        success: false,
        error: 'Failed to create message'
      }
    }
  }

}