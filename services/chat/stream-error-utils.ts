import {logger} from '@/lib/logger'
import {ErrorStreamEvent} from '@/lib/types/streaming-types'

export enum StreamErrorType {
  CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INSUFFICIENT_CREDITS_ERROR = 'INSUFFICIENT_CREDITS_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StreamError {
  type: StreamErrorType
  message: string
  recoverable: boolean
  retryable: boolean
  userFriendlyMessage?: string
}

export class StreamErrorHandler {
  
  /**
   * Classify an error and determine its characteristics
   */
  static classifyError(error: Error | string, context?: Record<string, any>): StreamError {
    const errorMessage = typeof error === 'string' ? error : error.message
    const lowerMessage = errorMessage.toLowerCase()

    // Client disconnection errors
    if (lowerMessage.includes('enqueue') || lowerMessage.includes('controller') || lowerMessage.includes('closed')) {
      return {
        type: StreamErrorType.CLIENT_DISCONNECTED,
        message: errorMessage,
        recoverable: false,
        retryable: false,
        userFriendlyMessage: 'Connection was interrupted'
      }
    }

    // Insufficient credits error (402)
    if (lowerMessage.includes('402') || lowerMessage.includes('insufficient credits') || lowerMessage.includes('payment required')) {
      return {
        type: StreamErrorType.INSUFFICIENT_CREDITS_ERROR,
        message: errorMessage,
        recoverable: false,
        retryable: false,
        userFriendlyMessage: 'Insufficient credits. Please add more credits to continue using the service.'
      }
    }

    // OpenRouter API errors
    if (lowerMessage.includes('openrouter') || lowerMessage.includes('429') || lowerMessage.includes('rate limit')) {
      return {
        type: StreamErrorType.RATE_LIMIT_ERROR,
        message: errorMessage,
        recoverable: false,
        retryable: true,
        userFriendlyMessage: 'Service is temporarily busy, please try again in a moment'
      }
    }

    // Database errors
    if (lowerMessage.includes('database') || lowerMessage.includes('prisma') || lowerMessage.includes('connection')) {
      return {
        type: StreamErrorType.DATABASE_ERROR,
        message: errorMessage,
        recoverable: true,
        retryable: true,
        userFriendlyMessage: 'Temporary data storage issue, your conversation will continue'
      }
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
      return {
        type: StreamErrorType.VALIDATION_ERROR,
        message: errorMessage,
        recoverable: false,
        retryable: false,
        userFriendlyMessage: 'Invalid request format'
      }
    }

    // Default to unknown error
    return {
      type: StreamErrorType.UNKNOWN_ERROR,
      message: errorMessage,
      recoverable: false,
      retryable: false,
      userFriendlyMessage: 'An unexpected error occurred'
    }
  }

  /**
   * Log error with appropriate level and context
   */
  static logStreamError(
    error: Error | string,
    context: {
      userId?: string
      chatId?: string
      phase?: string
      metadata?: Record<string, any>
    }
  ): void {
    const classifiedError = this.classifyError(error, context)
    const errorObj = typeof error === 'string' ? new Error(error) : error

    switch (classifiedError.type) {
      case StreamErrorType.CLIENT_DISCONNECTED:
        logger.info('Client disconnected during streaming', {
          userId: context.userId,
          chatId: context.chatId,
          metadata: { 
            ...context.metadata,
            phase: context.phase
          }
        })
        break

      case StreamErrorType.INSUFFICIENT_CREDITS_ERROR:
        logger.error('Insufficient credits error during streaming', errorObj, {
          userId: context.userId,
          chatId: context.chatId,
          metadata: {
            ...context.metadata,
            phase: context.phase
          }
        })
        break

      case StreamErrorType.RATE_LIMIT_ERROR:
        logger.warn('Rate limit encountered during streaming', {
          userId: context.userId,
          chatId: context.chatId,
          metadata: {
            ...context.metadata,
            phase: context.phase
          }
        })
        break

      case StreamErrorType.DATABASE_ERROR:
        logger.error('Database error during streaming', errorObj, {
          userId: context.userId,
          chatId: context.chatId,
          metadata: {
            ...context.metadata,
            phase: context.phase
          }
        })
        break

      case StreamErrorType.VALIDATION_ERROR:
        logger.warn('Validation error during streaming', {
          userId: context.userId,
          chatId: context.chatId,
          metadata: {
            ...context.metadata,
            phase: context.phase,
            error: classifiedError.message
          }
        })
        break

      default:
        logger.error('Unknown error during streaming', errorObj, {
          userId: context.userId,
          chatId: context.chatId,
          metadata: {
            ...context.metadata,
            phase: context.phase
          }
        })
        break
    }
  }


  /**
   * Create a standardized error response for the client
   */
  static formatErrorResponse(error: StreamError): string {
    return JSON.stringify({
      type: 'error',
      error: error.userFriendlyMessage || error.message
    })
  }

  /**
   * Get retry delay for retryable errors
   */
  static getRetryDelay(error: StreamError, attempt: number = 1): number {
    if (!error.retryable) return 0

    switch (error.type) {
      case StreamErrorType.RATE_LIMIT_ERROR:
        return Math.min(1000 * Math.pow(2, attempt), 30000) // Exponential backoff up to 30s
      case StreamErrorType.DATABASE_ERROR:
        return Math.min(500 * attempt, 5000) // Linear backoff up to 5s
      default:
        return 1000 * attempt // Default linear backoff
    }
  }
}