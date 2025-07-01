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

// Model ID Constants - Using only Gemini Flash 1.5 for all AI functionalities
export const MODEL_IDS = {
  // Primary Model - Used for all AI functionalities
  GOOGLE_GEMINI_1_5_FLASH: 'google/gemini-flash-1.5',
} as const

// Model Tiers Configuration - All tiers use the same model
export const MODEL_TIERS = {
  [ModelTier.BASIC]: [
    MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH,
  ],
  [ModelTier.PRO]: [
    MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH,
  ],
  [ModelTier.BUSINESS]: [
    MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH,
  ],
}

// Create array of all model IDs for validation  
export const ALL_MODEL_IDS = Object.values(MODEL_IDS) as string[]

export const AVAILABLE_MODELS: AIModel[] = [
  // Primary Model - Google Gemini Flash 1.5
  {
    id: MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH,
    name: 'Gemini Flash 1.5',
    description: 'Fast and efficient Google model with excellent performance and cost-effectiveness',
    provider: 'google',
    contextLength: 1000000,
    pricing: { input: 0.000075, output: 0.0003 }, // $0.075/M input, $0.30/M output
    tier: ModelTier.BASIC
  }
]

// OpenRouter Configuration Constants - Default to Gemini Flash 1.5
export const DEFAULT_MODEL = MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH
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
  
  // Fallback pricing similar to Gemini 1.5 Flash if no specific pricing
  const fallbackInputCost = 0.000075
  const fallbackOutputCost = 0.0003
  
  return (inputTokens / 1000) * fallbackInputCost + (outputTokens / 1000) * fallbackOutputCost
}

/**
 * Get models available for a specific subscription tier
 */
export function getModelsByTier(tier: ModelTierType): AIModel[] {
  const tierModels = MODEL_TIERS[tier] || []
  return AVAILABLE_MODELS.filter(model => (tierModels as string[]).includes(model.id))
}

/**
 * Check if a model is available for a specific subscription tier
 */
export function isModelAvailableForTier(modelId: string, tier: ModelTierType): boolean {
  const tierModels = MODEL_TIERS[tier] || []
  return (tierModels as string[]).includes(modelId)
}

/**
 * Get the most expensive model cost in a tier (for pricing calculations)
 */
export function getMaxTierCost(tier: ModelTierType): number {
  const models = getModelsByTier(tier)
  let maxCost = 0
  
  models.forEach(model => {
    if (model.pricing) {
      // Calculate cost per 1K tokens (assuming 1:2 input:output ratio)
      const avgCost = (model.pricing.input + 2 * model.pricing.output) / 3
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
  switch (plan) {
    case SubscriptionPlan.BASIC:
      return ModelTier.BASIC
    case SubscriptionPlan.PRO:
      return ModelTier.PRO
    case SubscriptionPlan.BUSINESS:
      return ModelTier.BUSINESS
    default:
      return ModelTier.BASIC
  }
} 