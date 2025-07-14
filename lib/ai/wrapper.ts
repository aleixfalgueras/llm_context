import { 
  openRouterService,
  type OpenRouterCompletionOptions,
  type UsageTrackingOptions,
  type StreamChunk
} from './openrouter'
import { AIProviderError } from './errors'
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
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle unexpected errors
    logger.aiError('openrouter', error as Error, { operation: 'createAICompletion' })
    throw new AIProviderError(
      'Unexpected AI service error',
      'openrouter',
      'unknown'
    )
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
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle unexpected errors
    logger.aiError('openrouter', error as Error, { operation: 'createAICompletionStream' })
    throw new AIProviderError(
      'Unexpected AI service error',
      'openrouter',
      'unknown'
    )
  }
}

 