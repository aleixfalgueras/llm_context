export type AIMessageRole = 'system' | 'user' | 'assistant'

export type ImageMessageContent = {
  type: 'image_url'
  image_url: {
    url: string // Base64 data URL
  }
}

export type TextMessageContent = {
  type: 'text'
  text: string
}

export type MessageContent = TextMessageContent | ImageMessageContent

// Message type that supports both simple string and complex content arrays
export type OpenRouterMessage = {
  role: AIMessageRole
  content: string | MessageContent[]
}

export interface OpenRouterCompletionOptions {
  model?: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  usage?: { include: boolean }
  modalities?: ('text' | 'image')[] // For image generation models
}

export interface StreamChunk {
  content: string
  isComplete: boolean
  generationId?: string // For fallback usage queries
  cost_usd?: number // Cost in USD, populated when isComplete is true
  images?: ImageMessageContent[] // Images generated during streaming (for image-capable models)
  error?: string // Error message if stream encounters an error
}

export interface UsageTrackingOptions {
  userId: string
  resourceId?: string
  additionalMetadata?: Record<string, any>
}

export interface GenerationStats {
  data: {
    id: string
    total_cost: number
    created_at: string
    model: string
    origin?: string
    usage?: number
    is_byok?: boolean
    upstream_id?: string
    cache_discount?: number
    upstream_inference_cost?: number
    app_id?: number
    streamed?: boolean
    cancelled?: boolean
    provider_name?: string
    latency?: number
    moderation_latency?: number
    generation_time?: number
    finish_reason?: string
    native_finish_reason?: string
    tokens_prompt?: number
    tokens_completion?: number
    native_tokens_prompt?: number
    native_tokens_completion?: number
    native_tokens_reasoning?: number
    num_media_prompt?: number
    num_media_completion?: number
    num_search_results?: number
  }
}

export interface ImageGenerationResponse {
  imageUrl: string
  cost_usd?: number
}