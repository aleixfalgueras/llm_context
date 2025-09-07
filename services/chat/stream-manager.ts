import {
  StreamEvent,
  StreamEventHandler,
  StreamState,
  StreamManagerConfig,
  ContentStreamEvent,
  ImageStreamEvent,
  CompletionStreamEvent,
  ErrorStreamEvent
} from '@/lib/types/streaming-types'
import {StreamingMessageService} from './streaming-message-service'
import {StreamChunk} from '@/lib/types/openrouter-types'
import {logger} from '@/lib/logger'

export class StreamManager {
  private readonly state: StreamState
  private config: StreamManagerConfig
  private eventHandlers: Partial<StreamEventHandler> = {}

  constructor(config: StreamManagerConfig) {
    this.config = config
    this.state = {
      chatId: config.chatId,
      userId: config.userId,
      fullContent: '',
      collectedImages: [],
      isComplete: false,
      hasErrors: false,
      controller: null as any, // Will be set when stream starts
      encoder: new TextEncoder()
    }

    // Set default event handlers (these could be pass as paramters if needed)
    this.eventHandlers = {
      onContent: this.handleContentEvent.bind(this),
      onImages: this.handleImageEvent.bind(this),
      onComplete: this.handleCompletionEvent.bind(this),
      onError: this.handleErrorEvent.bind(this)
    }
  }

  /**
   * Create a ReadableStream that processes stream chunks into events
   */
  createStream(streamSource: AsyncGenerator<StreamChunk, void, unknown>): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        this.state.controller = controller
        return this.processStream(streamSource)
      }
    })
  }

  /**
   * Process the stream chunks and emit events
   */
  private async processStream(streamSource: AsyncGenerator<StreamChunk, void, unknown>): Promise<void> {
    try {
      for await (const chunk of streamSource) {
        // Convert StreamChunk to StreamEvent and handle it
        if (chunk.images && chunk.images.length > 0) {
          await this.emitEvent({
            type: 'images',
            images: chunk.images,
            timestamp: new Date()
          })
        }

        if (chunk.content) {
          await this.emitEvent({
            type: 'content',
            content: chunk.content,
            timestamp: new Date()
          })
        }

        if (chunk.isComplete) {
          await this.emitEvent({
            type: 'complete',
            chatId: this.state.chatId,
            newTitle: this.config.newTitle,
            generationId: chunk.generationId,
            cost_usd: chunk.cost_usd,
            totalImages: this.state.collectedImages,
            timestamp: new Date()
          })
          
          this.closeStream()
          return
        }
      }
    } catch (error) {
      await this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Stream processing error',
        recoverable: false,
        chatId: this.state.chatId,
        timestamp: new Date()
      })
      
      this.closeStreamWithError()
    }
  }

  /**
   * Emit a stream event and handle it
   */
  private async emitEvent(event: StreamEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'content':
          if (this.eventHandlers.onContent) {
            await this.eventHandlers.onContent(event as ContentStreamEvent)
          }
          break
        case 'images':
          if (this.eventHandlers.onImages) {
            await this.eventHandlers.onImages(event as ImageStreamEvent)
          }
          break
        case 'complete':
          if (this.eventHandlers.onComplete) {
            await this.eventHandlers.onComplete(event as CompletionStreamEvent)
          }
          break
        case 'error':
          if (this.eventHandlers.onError) {
            await this.eventHandlers.onError(event as ErrorStreamEvent)
          }
          break
      }
    } catch (handlerError) {
      logger.error('Error in stream event handler', handlerError as Error, {
        userId: this.state.userId,
        chatId: this.state.chatId,
        metadata: {
          eventType: event.type
        }
      })
      
      // If handler fails, emit an error event (but avoid infinite loops)
      if (event.type !== 'error') {
        await this.handleErrorEvent({
          type: 'error',
          error: `Event handler failed: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`,
          recoverable: true,
          chatId: this.state.chatId,
          timestamp: new Date()
        })
      }
    }
  }

  /**
   * Handle content stream events
   */
  private async handleContentEvent(event: ContentStreamEvent): Promise<void> {
    this.state.fullContent += event.content
    
    const data = {
      type: 'content',
      content: event.content
    }

    if (!this.safeEnqueue(`data: ${JSON.stringify(data)}\n\n`)) {
      // Client disconnected - save partial message
      logger.info('Client disconnected during content streaming, saving partial message', {
        userId: this.state.userId,
        chatId: this.state.chatId,
        metadata: { partialLength: this.state.fullContent.length }
      })

      await StreamingMessageService.savePartialAssistantMessage(
        this.state.chatId,
        this.state.userId,
        this.state.fullContent,
        this.config.selectedModel
      )
    }
  }

  /**
   * Handle image stream events
   */
  private async handleImageEvent(event: ImageStreamEvent): Promise<void> {
    this.state.collectedImages.push(...event.images)
    
    const data = {
      type: 'images',
      images: event.images
    }

    if (!this.safeEnqueue(`data: ${JSON.stringify(data)}\n\n`)) {
      logger.info('Client disconnected during image streaming', {
        userId: this.state.userId,
        chatId: this.state.chatId
      })
    }
  }

  /**
   * Handle completion events
   */
  private async handleCompletionEvent(event: CompletionStreamEvent): Promise<void> {
    // Save the complete assistant message
    const saveResult = await StreamingMessageService.saveAssistantMessage(
      event.chatId,
      this.state.userId,
      this.state.fullContent,
      this.config.selectedModel,
      event.cost_usd || 0,
      event.generationId,
      event.totalImages && event.totalImages.length > 0 ? event.totalImages : undefined
    )

    if (!saveResult.success) {
      logger.error('Failed to save complete assistant message', new Error(saveResult.error), {
        userId: this.state.userId,
        chatId: event.chatId
      })
    }

    // Send completion signal to client
    const completionData = {
      type: 'complete',
      chatId: event.chatId,
      newTitle: event.newTitle
    }

    if (!this.safeEnqueue(`data: ${JSON.stringify(completionData)}\n\n`)) {
      logger.info('Client disconnected during completion signal', {
        userId: this.state.userId,
        chatId: event.chatId
      })
    }

    this.state.isComplete = true
  }

  /**
   * Handle error events
   */
  private async handleErrorEvent(event: ErrorStreamEvent): Promise<void> {
    this.state.hasErrors = true
    
    logger.error('Stream error event', new Error(event.error), {
      userId: this.state.userId,
      chatId: event.chatId,
      metadata: {
        recoverable: event.recoverable
      }
    })

    const errorData = {
      type: 'error',
      error: event.error
    }

    this.safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`)
    
    if (!event.recoverable) {
      this.closeStreamWithError()
    }
  }

  /**
   * Safely enqueue data to the stream controller
   */
  private safeEnqueue(data: string): boolean {
    try {
      this.state.controller.enqueue(this.state.encoder.encode(data))
      return true
    } catch (error) {
      // Controller is closed/aborted - client disconnected
      return false
    }
  }

  /**
   * Close the stream normally
   */
  private closeStream(): void {
    try {
      this.state.controller.close()
    } catch (error) {
      // Controller already closed, ignore
    }
  }

  /**
   * Close the stream with error
   */
  private closeStreamWithError(): void {
    try {
      this.state.controller.close()
    } catch (error) {
      // Controller already closed, ignore
    }
  }

}