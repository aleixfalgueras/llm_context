import { ModelTier, ModelTierType, SubscriptionPlan, SubscriptionPlanType } from '../types/subscription-types'

export interface AIModel {
  id: string
  name: string
  description: string
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'other'
  contextLength?: number
  pricing?: { input: number; output: number }
  tier?: ModelTierType
}

// Model ID Constants - Use these instead of literal strings throughout the codebase
export const MODEL_IDS = {
  // OpenAI models via OpenRouter
  OPENAI_GPT_4O: 'openai/gpt-4o',
  OPENAI_GPT_4O_MINI: 'openai/gpt-4o-mini',
  OPENAI_GPT_4_TURBO: 'openai/gpt-4-turbo',
  
  // Anthropic models via OpenRouter
  ANTHROPIC_CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  ANTHROPIC_CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  ANTHROPIC_CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  
  // Google models via OpenRouter
  GOOGLE_GEMINI_PRO: 'google/gemini-pro',
  GOOGLE_GEMINI_FLASH: 'google/gemini-flash',
  
  // Meta models via OpenRouter
  META_LLAMA_3_1_405B: 'meta-llama/llama-3.1-405b-instruct',
  META_LLAMA_3_1_70B: 'meta-llama/llama-3.1-70b-instruct',
  
  // Other models
  PERPLEXITY_SONAR_HUGE: 'perplexity/llama-3.1-sonar-huge-128k-online'
} as const

// Model Tiers Configuration
export const MODEL_TIERS = {
  [ModelTier.BASIC]: [
    MODEL_IDS.OPENAI_GPT_4O_MINI,
    MODEL_IDS.ANTHROPIC_CLAUDE_3_HAIKU,
    MODEL_IDS.GOOGLE_GEMINI_FLASH,
  ],
  [ModelTier.PRO]: [
    MODEL_IDS.OPENAI_GPT_4O,
    MODEL_IDS.ANTHROPIC_CLAUDE_3_5_SONNET,
    MODEL_IDS.GOOGLE_GEMINI_PRO,
    // Pro tier also includes basic tier models
    MODEL_IDS.OPENAI_GPT_4O_MINI,
    MODEL_IDS.ANTHROPIC_CLAUDE_3_HAIKU,
    MODEL_IDS.GOOGLE_GEMINI_FLASH,
  ],
} as const

// Create array of all model IDs for validation  
export const ALL_MODEL_IDS = Object.values(MODEL_IDS) as string[]

export const AVAILABLE_MODELS: AIModel[] = [
  // Basic Tier Models (Cost-effective)
  {
    id: MODEL_IDS.OPENAI_GPT_4O_MINI,
    name: 'GPT-4o Mini',
    description: 'Faster and more cost-effective OpenAI model',
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 0.00015, output: 0.0006 },
    tier: ModelTier.BASIC
  },
  {
    id: MODEL_IDS.ANTHROPIC_CLAUDE_3_HAIKU,
    name: 'Claude 3 Haiku',
    description: 'Fastest and most cost-effective Claude model',
    provider: 'anthropic',
    contextLength: 200000,
    pricing: { input: 0.00025, output: 0.00125 },
    tier: ModelTier.BASIC
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_FLASH,
    name: 'Gemini Flash',
    description: 'Fast and efficient Google model',
    provider: 'google',
    contextLength: 32000,
    pricing: { input: 0.00025, output: 0.00075 },
    tier: ModelTier.BASIC
  },
  
  // Pro Tier Models (Premium)
  {
    id: MODEL_IDS.OPENAI_GPT_4O,
    name: 'GPT-4o',
    description: 'Most capable OpenAI model, best for complex tasks',
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 0.0025, output: 0.01 },
    tier: ModelTier.PRO
  },
  {
    id: MODEL_IDS.ANTHROPIC_CLAUDE_3_5_SONNET,
    name: 'Claude 3.5 Sonnet',
    description: 'High-performance Claude model with exceptional reasoning',
    provider: 'anthropic',
    contextLength: 200000,
    pricing: { input: 0.003, output: 0.015 },
    tier: ModelTier.PRO
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_PRO,
    name: 'Gemini Pro',
    description: 'Google\'s flagship model for text and reasoning',
    provider: 'google',
    contextLength: 32000,
    pricing: { input: 0.0005, output: 0.0015 },
    tier: ModelTier.PRO
  }
]

// OpenRouter Configuration Constants - Default to basic tier model
export const DEFAULT_MODEL = MODEL_IDS.OPENAI_GPT_4O_MINI
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_PRESENCE_PENALTY = 0.1
export const DEFAULT_FREQUENCY_PENALTY = 0.1

// Consistent max tokens limit across all AI providers
// Large enough to avoid cutting responses, but prevents extremely long outputs
export const DEFAULT_MAX_TOKENS = 8000

/**
 * Get the default model, with optional environment override
 * Environment variable: OPENROUTER_DEFAULT_MODEL
 */
export function getDefaultModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_MODEL
}

/**
 * Get the default temperature, with optional environment override
 */
export function getDefaultTemperature(): number {
  return parseFloat(process.env.OPENROUTER_TEMPERATURE || DEFAULT_TEMPERATURE.toString())
}

/**
 * Get the default max tokens - consistent limit across all AI providers
 */
export function getDefaultMaxTokens(): number {
  return DEFAULT_MAX_TOKENS
}

/**
 * Get the default presence penalty, with optional environment override
 */
export function getDefaultPresencePenalty(): number {
  return parseFloat(process.env.OPENROUTER_PRESENCE_PENALTY || DEFAULT_PRESENCE_PENALTY.toString())
}

/**
 * Get the default frequency penalty, with optional environment override
 */
export function getDefaultFrequencyPenalty(): number {
  return parseFloat(process.env.OPENROUTER_FREQUENCY_PENALTY || DEFAULT_FREQUENCY_PENALTY.toString())
}

export function getModelById(modelId: string): AIModel | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId)
}

export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.name || modelId
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: AIModel['provider']): AIModel[] {
  return AVAILABLE_MODELS.filter(model => model.provider === provider)
}

/**
 * Get the default model for new chats from localStorage, with validation
 * Falls back to system default if saved model is invalid or not found
 */
export function getDefaultModelForNewChats(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_MODEL // Server-side fallback
  }

  try {
    const savedModel = localStorage.getItem('chat-default-model')
    if (savedModel) {
      // Validate that the saved model is still available
      const isValidModel = AVAILABLE_MODELS.some(model => model.id === savedModel)
      if (isValidModel) {
        return savedModel
      } else {
        // Remove invalid model from localStorage
        localStorage.removeItem('chat-default-model')
      }
    }
  } catch (error) {
    console.error('Failed to load saved default model:', error)
  }
  
  return DEFAULT_MODEL
}

/**
 * Save the default model for new chats to localStorage
 */
export function saveDefaultModelForNewChats(modelId: string): void {
  if (typeof window === 'undefined') return // Server-side safety
  
  try {
    localStorage.setItem('chat-default-model', modelId)
  } catch (error) {
    console.error('Failed to save default model:', error)
  }
}

/**
 * Get estimated cost for a model based on tokens
 */
export function getModelCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelById(modelId)
  
  if (model?.pricing) {
    return (inputTokens / 1000) * model.pricing.input + (outputTokens / 1000) * model.pricing.output
  }
  
  // Fallback pricing similar to GPT-4o-mini if no specific pricing
  const fallbackInputCost = 0.00015
  const fallbackOutputCost = 0.0006
  
  return (inputTokens / 1000) * fallbackInputCost + (outputTokens / 1000) * fallbackOutputCost
}

/**
 * Get models available for a specific subscription tier
 */
export function getModelsByTier(tier: ModelTierType): AIModel[] {
  if (tier === ModelTier.BASIC) {
    return AVAILABLE_MODELS.filter(model => model.tier === ModelTier.BASIC)
  } else {
    // Pro tier includes both basic and pro models
    return AVAILABLE_MODELS
  }
}

/**
 * Check if a model is available for a specific subscription tier
 */
export function isModelAvailableForTier(modelId: string, tier: ModelTierType): boolean {
  const availableModels = getModelsByTier(tier)
  return availableModels.some(model => model.id === modelId)
}

/**
 * Get the most expensive model cost in a tier (for pricing calculations)
 */
export function getMaxTierCost(tier: ModelTierType): number {
  const models = getModelsByTier(tier)
  let maxCost = 0
  
  models.forEach(model => {
    if (model.pricing) {
      // Calculate average cost per 1K tokens (assuming 50/50 input/output split)
      const avgCost = (model.pricing.input + model.pricing.output) / 2
      if (avgCost > maxCost) {
        maxCost = avgCost
      }
    }
  })
  
  return maxCost
}

/**
 * Get subscription tier from plan name
 */
export function getTierFromPlan(plan: SubscriptionPlanType): ModelTierType {
  if (plan === SubscriptionPlan.BASIC) return ModelTier.BASIC
  return ModelTier.PRO // Both 'pro' and 'business' plans use pro tier models
} 