export type AIMessageRole = 'system' | 'user' | 'assistant'

export interface OpenRouterCompletionOptions {
  model?: string
  messages: Array<{ role: AIMessageRole, content: string }>
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  usage?: { include: boolean }
}

export interface StreamChunk {
  content: string
  isComplete: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  generationId?: string // For fallback usage queries
}

export interface UsageTrackingOptions {
  userId: string
  resourceId?: string
  additionalMetadata?: Record<string, any>
}