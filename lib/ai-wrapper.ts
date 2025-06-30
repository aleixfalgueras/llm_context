import { 
  createOpenRouterCompletion, 
  createOpenRouterCompletionStream,
  OpenRouterCompletionOptions,
  UsageTrackingOptions,
  StreamChunk
} from './openrouter-wrapper'
import { AIProviderError } from './ai-errors'

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
    return await createOpenRouterCompletion(completionOptions, trackingOptions)
  } catch (error) {
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in AI completion:', error)
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
    yield* createOpenRouterCompletionStream(completionOptions, trackingOptions)
  } catch (error) {
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in AI completion stream:', error)
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
    document: 'documents',
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
    case 'documents':
      errorMessage = `You've reached your monthly document limit of ${limit} documents. `
      upgradeMessage = 'Upgrade to Pro for 200 documents or Business for unlimited documents.'
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