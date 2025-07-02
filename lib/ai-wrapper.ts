import { 
  openRouterService,
  type OpenRouterCompletionOptions,
  type UsageTrackingOptions,
  type StreamChunk
} from './openrouter'
import { AIProviderError } from './ai-errors'
import { logger } from './logger'

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

/**
 * Create usage limit response for OpenRouter API
 */
export function createUsageLimitResponse(action: string, limit: number | 'unlimited', limitType?: string, used?: number) {
  const actionMessages = {
    client: 'clients'
  }

  const message = actionMessages[action as keyof typeof actionMessages] || action
  
  // Enhanced error messages based on limit type
  let errorMessage = ''
  let upgradeMessage = ''
  
  switch (limitType) {
    case 'tokens':
      errorMessage = `You've used ${used?.toLocaleString()} tokens and reached your monthly token limit of ${limit === 'unlimited' ? 'unlimited' : (limit as number).toLocaleString()}. `
      upgradeMessage = 'Upgrade to Pro for 2M tokens per month or Business for unlimited tokens.'
      break
    default:
      errorMessage = `You've reached your monthly ${message} limit of ${limit}. `
      upgradeMessage = `Upgrade to Pro for more ${message}.`
  }

  return Response.json(
    {
      error: errorMessage + upgradeMessage,
      code: 'USAGE_LIMIT_EXCEEDED',
      limitType: limitType || 'count',
      used,
      limit,
      upgradeUrl: '/pricing'
    },
    { status: 429 }
  )
} 