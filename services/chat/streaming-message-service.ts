import {MessageService} from '@/services/chat/message-service'
import {Role} from '@prisma/client'
import {ImageMessageContent} from '@/lib/types/openrouter-types'
import {logger} from '@/lib/logger'


export interface StreamingMessageResult {
  success: boolean
  error?: string
  messageId?: string
}

export class StreamingMessageService {
  
  /**
   * Save a user message to the database
   */
  static async saveUserMessage(
    chatId: string,
    userId: string,
    content: string,
    model: string
  ): Promise<StreamingMessageResult> {
    try {
      await MessageService.createMessage({
        content,
        role: Role.USER,
        model,
        cost_usd: 0,
        chat: { connect: { id: chatId } }
      }, userId)

      return { success: true }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to save user message', error as Error, { userId, chatId })
      
      return { 
        success: false, 
        error: errorMsg 
      }
    }
  }

  /**
   * Save a complete assistant message with all metadata
   */
  static async saveAssistantMessage(
    chatId: string,
    userId: string,
    content: string,
    model: string,
    cost_usd: number = 0,
    generationId?: string,
    images?: ImageMessageContent[]
  ): Promise<StreamingMessageResult> {

    try {
      await MessageService.createMessage({
        content,
        role: Role.ASSISTANT,
        model,
        cost_usd,
        generation_id: generationId,
        ...(images && images.length > 0 && { images }),
        chat: { connect: { id: chatId } }
      }, userId)

      return { success: true }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to save assistant message', error as Error, { 
        userId, 
        chatId,
        metadata: { 
          contentLength: content.length,
          cost_usd,
          generationId
        }
      })

      return {
        success: false,
        error: errorMsg
      }
    }
  }

  /**
   * Save a partial assistant message (when stream is interrupted)
   */
  static async savePartialAssistantMessage(
    chatId: string,
    userId: string,
    partialContent: string,
    model: string
  ): Promise<StreamingMessageResult> {
    if (!partialContent.trim()) {
      return { success: true }
    }

    try {
      await MessageService.createMessage({
        content: partialContent,
        role: Role.ASSISTANT,
        model,
        cost_usd: 0, // 0 cost for partial message
        chat: { connect: { id: chatId } }
      }, userId)

      logger.info('Partial assistant message saved', { 
        userId, 
        chatId,
        metadata: { partialLength: partialContent.length }
      })

      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to save partial assistant message', error as Error, { 
        userId, 
        chatId,
        metadata: { partialLength: partialContent.length }
      })

      return {
        success: false,
        error: errorMsg
      }
    }
  }

}