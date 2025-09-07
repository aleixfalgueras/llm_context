import {ImageMessageContent} from './openrouter-types'

export interface StreamState {
  chatId: string
  userId: string
  fullContent: string
  collectedImages: ImageMessageContent[]
  isComplete: boolean
  hasErrors: boolean
  controller: ReadableStreamDefaultController<Uint8Array>
  encoder: TextEncoder
}

export interface StreamManagerConfig {
  chatId: string
  userId: string
  selectedModel: string
  newTitle?: string
  clientDisconnectTimeout?: number
}

export interface StreamingResponseConfig {
  chatId: string
  userId: string
  selectedModel: string
  clientId?: string | null
  newTitle?: string
  headers?: Record<string, string>
}

export interface StreamingResponse {
  stream: ReadableStream<Uint8Array>
  response: Response
}

export interface StreamingProvider {
  createStreamingCompletion(
    options: any,
    usageOptions?: any
  ): AsyncGenerator<any, void, unknown>
}

export interface StreamingService {
  createResponse(config: StreamingResponseConfig, streamSource: AsyncGenerator<any, void, unknown>): Promise<StreamingResponse>
  handleStreamError(error: Error, config: StreamingResponseConfig): Promise<Response>
}

// ################ STREAM EVENT ################

export type StreamEventType = 'content' | 'images' | 'complete' | 'error'

export interface BaseStreamEvent {
  type: StreamEventType
  timestamp?: Date
}

export interface ContentStreamEvent extends BaseStreamEvent {
  type: 'content'
  content: string
}

export interface ImageStreamEvent extends BaseStreamEvent {
  type: 'images'
  images: ImageMessageContent[]
}

export interface CompletionStreamEvent extends BaseStreamEvent {
  type: 'complete'
  chatId: string
  newTitle?: string
  generationId?: string
  cost_usd?: number
  totalImages?: ImageMessageContent[]
}

export interface ErrorStreamEvent extends BaseStreamEvent {
  type: 'error'
  error: string
  recoverable?: boolean
  chatId?: string
}

export type StreamEvent = ContentStreamEvent | ImageStreamEvent | CompletionStreamEvent | ErrorStreamEvent

export interface StreamEventHandler {
  onContent?(event: ContentStreamEvent): Promise<void> | void
  onImages?(event: ImageStreamEvent): Promise<void> | void  
  onComplete?(event: CompletionStreamEvent): Promise<void> | void
  onError?(event: ErrorStreamEvent): Promise<void> | void
}
