import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { trackUsage } from './usage-middleware'
import { calculateAICost } from './subscription-utils'
import { 
  getDefaultModel, 
  getDefaultTemperature, 
  getDefaultMaxTokens,
  getDefaultPresencePenalty, 
  getDefaultFrequencyPenalty 
} from './models-config'
import { AIProviderError } from './ai-errors'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AICompletionOptions {
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



/**
 * Enhanced error handling for OpenAI provider errors
 */
function handleOpenAIError(error: any): never {
  if (error.name === 'OpenAIError' || error.constructor?.name === 'OpenAIError') {
    // Handle OpenAI-specific errors
    const status = error.status || error.statusCode
    
    if (status === 429) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : undefined
      throw new AIProviderError(
        error.message || 'Rate limit exceeded',
        'openai',
        'rate_limit',
        status,
        retryAfter
      )
    } else if (status === 401 || status === 403) {
      throw new AIProviderError(
        error.message || 'Authentication failed',
        'openai',
        'authentication',
        status
      )
    } else if (status === 503 || status === 502) {
      throw new AIProviderError(
        error.message || 'Service temporarily unavailable',
        'openai',
        'service_unavailable',
        status
      )
    } else if (status === 422 && error.message?.includes('quota')) {
      throw new AIProviderError(
        error.message || 'Quota exceeded',
        'openai',
        'quota_exceeded',
        status
      )
    }
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    throw new AIProviderError(
      'Request timed out',
      'openai',
      'timeout'
    )
  }
  
  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('network')) {
    throw new AIProviderError(
      'Network connection failed',
      'openai',
      'service_unavailable'
    )
  }
  
  // Generic OpenAI provider error
  throw new AIProviderError(
    error.message || 'OpenAI service error',
    'openai',
    'unknown',
    error.status || error.statusCode
  )
}

/**
 * Enhanced error handling for Anthropic errors
 */
function handleAnthropicError(error: any): never {
  if (error.name === 'AnthropicError' || error.constructor?.name === 'AnthropicError') {
    // Handle Anthropic-specific errors
    const status = error.status || error.statusCode
    
    if (status === 429) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) * 1000 : undefined
      throw new AIProviderError(
        error.message || 'Rate limit exceeded',
        'anthropic',
        'rate_limit',
        status,
        retryAfter
      )
    } else if (status === 401 || status === 403) {
      throw new AIProviderError(
        error.message || 'Authentication failed',
        'anthropic',
        'authentication',
        status
      )
    } else if (status === 503 || status === 502) {
      throw new AIProviderError(
        error.message || 'Service temporarily unavailable',
        'anthropic',
        'service_unavailable',
        status
      )
    } else if (status === 422 && error.message?.includes('quota')) {
      throw new AIProviderError(
        error.message || 'Quota exceeded',
        'anthropic',
        'quota_exceeded',
        status
      )
    }
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    throw new AIProviderError(
      'Request timed out',
      'anthropic',
      'timeout'
    )
  }
  
  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('network')) {
    throw new AIProviderError(
      'Network connection failed',
      'anthropic',
      'service_unavailable'
    )
  }
  
  // Generic Anthropic error
  throw new AIProviderError(
    error.message || 'Anthropic service error',
    'anthropic',
    'unknown',
    error.status || error.statusCode
  )
}

/**
 * Unified AI API wrapper that handles multiple providers (OpenAI and Anthropic)
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
    estimatedCost: number
  } | null
}> {
  const model = completionOptions.model || getDefaultModel()
  
  // Determine provider based on model
  const isAnthropic = model.startsWith('claude-')
  const provider = isAnthropic ? 'anthropic' : 'openai'
  
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
  console.log(`🤖 AI Model Request: ${model} (${provider}) | Service: ${serviceSource} | User: ${trackingOptions.userId}`)
  
  try {
    if (isAnthropic) {
      return await createClaudeCompletion(completionOptions, trackingOptions)
    } else {
      return await createOpenAICompletion(completionOptions, trackingOptions)
    }
  } catch (error) {
    // Re-throw AIProviderError as-is
    if (error instanceof AIProviderError) {
      throw error
    }
    
    // Handle other errors based on provider
    if (isAnthropic) {
      handleAnthropicError(error)
    } else {
      handleOpenAIError(error)
    }
  }
}

/**
 * OpenAI provider completion handler
 */
async function createOpenAICompletion(
  completionOptions: AICompletionOptions,
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

  const response = await openai.chat.completions.create({
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
    const estimatedCost = calculateAICost(
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
}

/**
 * Claude completion handler
 */
async function createClaudeCompletion(
  completionOptions: AICompletionOptions,
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
  const temperature = Math.max(0, Math.min(1, completionOptions.temperature ?? getDefaultTemperature()))
  // Claude requires max_tokens to be present, use consistent limit across all providers
  const maxTokens = completionOptions.max_tokens ?? getDefaultMaxTokens()

  // Convert messages format for Claude
  const systemMessage = completionOptions.messages.find(m => m.role === 'system')
  const conversationMessages = completionOptions.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

  const response = await anthropic.messages.create({
    model,
    max_tokens: Math.max(1, maxTokens),
    temperature,
    system: systemMessage?.content,
    messages: conversationMessages,
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
  
  // Calculate usage and cost
  let usageInfo = null
  
  if (response.usage) {
    const estimatedCost = calculateAICost(
      model,
      response.usage.input_tokens,
      response.usage.output_tokens
    )

    usageInfo = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      estimatedCost
    }

    // Track usage
    await trackUsage(trackingOptions.userId, trackingOptions.eventType, trackingOptions.resourceId, {
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      estimatedCost,
      model,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      ...trackingOptions.additionalMetadata
    })
  }

  return {
    content,
    usage: usageInfo
  }
}

/**
 * Check if user can perform an action (with enhanced error response for different limit types)
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
      errorMessage = `You've used ${used?.toLocaleString()} tokens and reached your monthly token limit of ${limit === -1 ? 'unlimited' : (limit as number).toLocaleString()}. `
      upgradeMessage = 'Upgrade to Pro for 2M tokens per month or Business for unlimited tokens.'
      break
    case 'cost':
      errorMessage = `You've spent $${used?.toFixed(2)} and reached your monthly AI cost limit of $${limit === -1 ? 'unlimited' : (limit as number).toFixed(2)}. `
      upgradeMessage = 'Upgrade to Pro for $25/month limit or Business for unlimited AI usage.'
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