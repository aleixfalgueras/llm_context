import {
  StreamingService,
  StreamingResponse,
  StreamingResponseConfig,
  StreamManagerConfig
} from '@/lib/types/streaming-types'
import {StreamManager} from './stream-manager'
import {StreamErrorHandler, StreamErrorType} from '@/services/chat/stream-error-utils'
import {logger} from '@/lib/logger'

export class ChatStreamingService implements StreamingService {

  /**
   * Create a streaming response using ChatStreamManager
   */
  async createResponse(
    config: StreamingResponseConfig,
    streamSource: AsyncGenerator<any, void, unknown>
  ): Promise<StreamingResponse> {

    const managerConfig: StreamManagerConfig = {
      chatId: config.chatId,
      userId: config.userId,
      selectedModel: config.selectedModel,
      newTitle: config.newTitle
    }

    const streamManager = new StreamManager(managerConfig)
    const stream = streamManager.createStream(streamSource)

    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...config.headers
      }
    })

    return {
      stream,
      response
    }
  }

  /**
   * Create a streaming response with comprehensive error handling
   */
  async createStreamingResponse(
    config: StreamingResponseConfig,
    streamFactory: () => AsyncGenerator<any, void, unknown>
  ): Promise<Response> {
    try {
      const streamSource = streamFactory()
      const streamingResponse = await this.createResponse(config, streamSource)
      return streamingResponse.response

    } catch (error) {
      logger.error('Failed to create streaming response', error as Error, {
        userId: config.userId,
        chatId: config.chatId
      })

      return this.handleStreamError(error as Error, config)
    }
  }

  /**
   * Create a streaming response with retry logic for retryable errors
   */
  async createStreamingResponseWithRetry(
    config: StreamingResponseConfig,
    streamFactory: () => AsyncGenerator<any, void, unknown>,
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.createStreamingResponse(config, streamFactory)

      } catch (error) {
        lastError = error as Error
        const streamError = StreamErrorHandler.classifyError(error as Error)

        // Only retry for retryable errors
        if (!streamError.retryable || attempt === maxRetries) {
          break
        }

        const delay = StreamErrorHandler.getRetryDelay(streamError, attempt)
        logger.info(`Retrying streaming response creation in ${delay}ms`, {
          userId: config.userId,
          chatId: config.chatId,
          metadata: {
            attempt,
            maxRetries,
            error: (error as Error).message
          }
        })

        // Wait before retry
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed, return error response
    return this.handleStreamError(lastError!, config)
  }

  /**
   * Handle stream errors with standardized error responses
   */
  async handleStreamError(
    error: Error,
    config: StreamingResponseConfig
  ): Promise<Response> {

    const streamError = StreamErrorHandler.classifyError(error)

    // Log the error appropriately
    StreamErrorHandler.logStreamError(error, {
      userId: config.userId,
      chatId: config.chatId,
      phase: 'stream_creation'
    })

    // Create error response
    const errorResponse = StreamErrorHandler.formatErrorResponse(streamError)

    // For client disconnection, return a 499 status (client closed connection)
    const statusCode = streamError.type === StreamErrorType.CLIENT_DISCONNECTED ? 499 : 500

    return new Response(`data: ${errorResponse}\n\n`, {
      status: statusCode,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })
  }

}

// Singleton instance for use throughout the application
export const chatStreamingService = new ChatStreamingService()