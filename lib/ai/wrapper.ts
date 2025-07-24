import { 
  openRouterService,
  type OpenRouterCompletionOptions,
  type UsageTrackingOptions,
  type StreamChunk
} from './openrouter'
import { logger } from '../logger'

// Re-export interfaces for backward compatibility
export interface AICompletionOptions extends OpenRouterCompletionOptions {}
export type { UsageTrackingOptions, StreamChunk }

/**
 * Unified AI API wrapper using OpenRouter
 * Unified AI wrapper using OpenRouter for 400+ models
 */
export async function createAICompletion(
  completionOptions: AICompletionOptions,
  trackingOptions: UsageTrackingOptions
): Promise<{
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  } | null
}> {
  try {
    const result = await openRouterService.createCompletion(completionOptions, trackingOptions)
    return {
      content: result.content,
      usage: result.usage || null
    }
  } catch (error) {
    // Handle unexpected errors
    logger.error('AI service error', error as Error, { operation: 'createAICompletion' })
    throw error
  }
}

/**
 * Streaming version of the unified AI API wrapper using OpenRouter
 */
export async function* createAICompletionStream(
  completionOptions: AICompletionOptions,
  trackingOptions: UsageTrackingOptions
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    yield* openRouterService.createStreamingCompletion(completionOptions, trackingOptions)
  } catch (error) {
    // Handle unexpected errors
    logger.error('AI service error', error as Error, { operation: 'createAICompletionStream' })
    throw error
  }
}

 