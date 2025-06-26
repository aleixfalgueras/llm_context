import OpenAI from 'openai'
import { trackUsage } from './usage-middleware'
import { calculateAICost } from './subscription-utils'
import { 
  getDefaultModel, 
  getDefaultTemperature, 
  getDefaultMaxTokens, 
  getDefaultPresencePenalty, 
  getDefaultFrequencyPenalty 
} from './models-config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface OpenAICompletionOptions {
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
 * Unified OpenAI API wrapper that handles usage tracking and cost calculation
 */
export async function createOpenAICompletion(
  completionOptions: OpenAICompletionOptions,
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
  const maxTokens = Math.max(1, completionOptions.max_tokens ?? getDefaultMaxTokens())
  const presencePenalty = Math.max(-2, Math.min(2, completionOptions.presence_penalty ?? getDefaultPresencePenalty()))
  const frequencyPenalty = Math.max(-2, Math.min(2, completionOptions.frequency_penalty ?? getDefaultFrequencyPenalty()))

  const response = await openai.chat.completions.create({
    model,
    messages: completionOptions.messages,
    temperature,
    max_tokens: maxTokens,
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
      errorMessage = `You've spent $${used?.toFixed(2)} and reached your monthly OpenAI cost limit of $${limit === -1 ? 'unlimited' : (limit as number).toFixed(2)}. `
      upgradeMessage = 'Upgrade to Pro for $25/month limit or Business for unlimited OpenAI usage.'
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