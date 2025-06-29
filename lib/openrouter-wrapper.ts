import OpenAI from 'openai'
import { trackUsage } from './usage-middleware'
import { calculateOpenRouterCost } from './subscription-utils'
import { 
  getDefaultModel, 
  getDefaultTemperature, 
  getDefaultMaxTokens,
  getDefaultPresencePenalty, 
  getDefaultFrequencyPenalty 
} from './models-config'
import { AIProviderError } from './ai-errors'

// OpenRouter client using OpenAI SDK (OpenRouter is OpenAI-compatible)
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000", // Optional, for rankings
    "X-Title": process.env.SITE_NAME || "LLM Context App", // Optional, shows in rankings
  },
})

export interface OpenRouterCompletionOptions {
  model?: string
  messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
}

export interface UsageTrackingOptions {
  userId: string
  eventType: 'document_generation'
  resourceId?: string
  additionalMetadata?: Record<string, any>
}

// New interface for streaming responses
export interface StreamChunk {
  content: string
  isComplete: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
}

/**
 * Enhanced error handling for OpenRouter API errors
 */
function handleOpenRouterError(error: any): never {
  if (error.name === 'OpenAIError' || error.constructor?.name === 'OpenAIError') {
    // Handle OpenRouter-specific errors (they use OpenAI format)
    const status = error.status || error.statusCode
    
    if (status === 429) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : undefined
      throw new AIProviderError(
        error.message || 'Rate limit exceeded',
        'openrouter',
        'rate_limit',
        status,
        retryAfter
      )
    } else if (status === 401 || status === 403) {
      throw new AIProviderError(
        error.message || 'Authentication failed - check OpenRouter API key',
        'openrouter',
        'authentication',
        status
      )
    } else if (status === 402) {
      throw new AIProviderError(
        error.message || 'Insufficient credits in OpenRouter account',
        'openrouter',
        'insufficient_credits',
        status
      )
    } else if (status === 503 || status === 502) {
      throw new AIProviderError(
        error.message || 'OpenRouter service temporarily unavailable',
        'openrouter',
        'service_unavailable',
        status
      )
    } else if (status === 400 && error.message?.includes('model')) {
      throw new AIProviderError(
        error.message || 'Invalid model specified',
        'openrouter',
        'invalid_model',
        status
      )
    }
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    throw new AIProviderError(
      'Request timed out',
      'openrouter',
      'timeout'
    )
  }
  
  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('network')) {
    throw new AIProviderError(
      'Network connection failed',
      'openrouter',
      'service_unavailable'
    )
  }
  
  // Generic OpenRouter error
  throw new AIProviderError(
    error.message || 'OpenRouter service error',
    'openrouter',
    'unknown',
    error.status || error.statusCode
  )
}

/**
 * Unified OpenRouter API wrapper that handles usage tracking and cost calculation
 */
export async function createOpenRouterCompletion(
  completionOptions: OpenRouterCompletionOptions,
  trackingOptions: UsageTrackingOptions
): Promise<{
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  } | null
}> {
  const model = completionOptions.model || getDefaultModel()
  
  // Use centralized configuration with validation
  const temperature = Math.max(0, Math.min(2, completionOptions.temperature ?? getDefaultTemperature()))
  const maxTokens = completionOptions.max_tokens ?? getDefaultMaxTokens()
  const presencePenalty = Math.max(-2, Math.min(2, completionOptions.presence_penalty ?? getDefaultPresencePenalty()))
  const frequencyPenalty = Math.max(-2, Math.min(2, completionOptions.frequency_penalty ?? getDefaultFrequencyPenalty()))

  // Determine service source from metadata
  const documentType = trackingOptions.additionalMetadata?.documentType
  let serviceSource = 'unknown'
  
  if (documentType === 'meeting-report') {
    serviceSource = 'meeting-report-generator'
  } else if (documentType === 'custom-document') {
    serviceSource = 'custom-document-generator'
  } else if (trackingOptions.resourceId && trackingOptions.resourceId.startsWith('chat')) {
    serviceSource = 'chat-assistant'
  } else if (trackingOptions.eventType === 'document_generation') {
    serviceSource = 'document-generation'
  }
  
  // Log model usage information
  console.log(`🚀 OpenRouter Request: ${model} | Service: ${serviceSource} | User: ${trackingOptions.userId}`)

  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages: completionOptions.messages,
      temperature,
      max_tokens: Math.max(1, maxTokens),
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // Calculate usage and cost
    const usage = response.usage
    let usageInfo = null
    
    if (usage) {
      const estimatedCost = calculateOpenRouterCost(
        model,
        usage.prompt_tokens,
        usage.completion_tokens
      )

      usageInfo = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost
      }

      // Track usage
      await trackUsage(trackingOptions.userId, trackingOptions.eventType, trackingOptions.resourceId, {
        tokensUsed: usage.total_tokens,
        estimatedCost,
        model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        ...trackingOptions.additionalMetadata
      })
    }

    return {
      content,
      usage: usageInfo
    }
  } catch (error) {
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle OpenRouter errors
    handleOpenRouterError(error)
  }
}

/**
 * OpenRouter streaming completion handler
 */
export async function* createOpenRouterCompletionStream(
  completionOptions: OpenRouterCompletionOptions,
  trackingOptions: UsageTrackingOptions
): AsyncGenerator<StreamChunk, void, unknown> {
  const model = completionOptions.model || getDefaultModel()
  
  // Use centralized configuration with validation
  const temperature = Math.max(0, Math.min(2, completionOptions.temperature ?? getDefaultTemperature()))
  const maxTokens = completionOptions.max_tokens ?? getDefaultMaxTokens()
  const presencePenalty = Math.max(-2, Math.min(2, completionOptions.presence_penalty ?? getDefaultPresencePenalty()))
  const frequencyPenalty = Math.max(-2, Math.min(2, completionOptions.frequency_penalty ?? getDefaultFrequencyPenalty()))

  // Determine service source from metadata
  const documentType = trackingOptions.additionalMetadata?.documentType
  let serviceSource = 'unknown'
  
  if (documentType === 'meeting-report') {
    serviceSource = 'meeting-report-generator'
  } else if (documentType === 'custom-document') {
    serviceSource = 'custom-document-generator'
  } else if (trackingOptions.resourceId && trackingOptions.resourceId.startsWith('chat')) {
    serviceSource = 'chat-assistant'
  } else if (trackingOptions.eventType === 'document_generation') {
    serviceSource = 'document-generation'
  }
  
  // Log model usage information
  console.log(`🚀 OpenRouter Streaming Request: ${model} | Service: ${serviceSource} | User: ${trackingOptions.userId}`)

  try {
    const stream = await openrouter.chat.completions.create({
      model,
      messages: completionOptions.messages,
      temperature,
      max_tokens: Math.max(1, maxTokens),
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      stream: true,
    })

    let fullContent = ''
    let usage = null

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      
      if (delta?.content) {
        fullContent += delta.content
        yield {
          content: delta.content,
          isComplete: false
        }
      }

      // Handle usage information from the final chunk
      if (chunk.usage) {
        usage = chunk.usage
      }
    }

    // Calculate final usage and cost
    let usageInfo = null
    if (usage) {
      const estimatedCost = calculateOpenRouterCost(
        model,
        usage.prompt_tokens,
        usage.completion_tokens
      )

      usageInfo = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost
      }

      // Track usage after completion
      await trackUsage(trackingOptions.userId, trackingOptions.eventType, trackingOptions.resourceId, {
        tokensUsed: usage.total_tokens,
        estimatedCost,
        model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        ...trackingOptions.additionalMetadata
      })
    }

    // Final chunk with completion flag and usage
    yield {
      content: '',
      isComplete: true,
      usage: usageInfo || undefined
    }
  } catch (error) {
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle OpenRouter errors
    handleOpenRouterError(error)
  }
}

/**
 * Fetch available models from OpenRouter API
 */
export async function fetchOpenRouterModels(): Promise<any[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error)
    return []
  }
}

/**
 * Get OpenRouter account credits
 */
export async function getOpenRouterCredits(): Promise<{ credits: number } | null> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credits: ${response.statusText}`)
    }
    
    const data = await response.json()
    return { credits: data.data.limit || 0 }
  } catch (error) {
    console.error('Failed to fetch OpenRouter credits:', error)
    return null
  }
} 