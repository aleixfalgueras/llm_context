import {ModelTier, ModelTierType, SubscriptionPlanType} from '@/lib/types/subscription-types'
import {SubscriptionPlan} from "@prisma/client";

/**
 * Description contains the json key in the translation files, starting from namespace 'assistant.modelSelector'.
 *
 * Pricing:
 *  - Input and Output is the dollar price per M tokens.
 *  - Image Input and Output is the dollar price per Kb
 */
export interface AIModel {
  id: string
  name: string
  description: string
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'other'
  contextLength?: number
  pricing?: { input: number; output: number, imageInput?: number, imageOutput?: number }
  tier?: ModelTierType
}

export const MODEL_IDS = {
  GOOGLE_GEMINI_2_0_FLASH: 'google/gemini-2.0-flash-001',
  OPENAI_GPT_4_1_NANO: 'openai/gpt-4.1-nano',
  GOOGLE_GEMINI_2_5_FLASH_IMAGE: 'google/gemini-2.5-flash-image-preview'
} as const

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    name: 'Gemini 2.0',
    description: "gemini",
    provider: 'google',
    contextLength: 1000000,
    pricing: { input: 0.1, output: 0.4 },
    tier: ModelTier.APPRENTICE
  },
  {
    id: MODEL_IDS.OPENAI_GPT_4_1_NANO,
    name: 'ChatGPT 4.1',
    description: "chatgpt",
    provider: 'openai',
    contextLength: 1000000,
    pricing: { input: 0.1, output: 0.4 },
    tier: ModelTier.APPRENTICE
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE,
    name: 'Gemini 2.5 Image',
    description: "gemini_image",
    provider: 'google',
    contextLength: 32768,
    pricing: { input: 0.3, output: 2.5, imageInput: 1.238, imageOutput: 0.03 },
    tier: ModelTier.APPRENTICE
  }
]

export const IMAGE_GENERATION_MODEL_ID = MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE

export const MODEL_TIERS = {
  [ModelTier.APPRENTICE]: [
    MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    MODEL_IDS.OPENAI_GPT_4_1_NANO,
    MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE
  ],
  [ModelTier.KNIGHT]: [
    MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    MODEL_IDS.OPENAI_GPT_4_1_NANO,
    MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE
  ],
  [ModelTier.MASTER]: [
    MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    MODEL_IDS.OPENAI_GPT_4_1_NANO,
    MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE
  ],
  [ModelTier.JEDI]: [
    MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    MODEL_IDS.OPENAI_GPT_4_1_NANO,
    MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE
  ],
}

// OpenRouter Configuration Constants
export const DEFAULT_MODEL = MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH
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
 * Get subscription tier from plan name
 */
export function getTierFromPlan(plan: SubscriptionPlanType): ModelTierType {
  switch (plan) {
    case SubscriptionPlan.apprentice:
      return ModelTier.APPRENTICE
    case SubscriptionPlan.knight:
      return ModelTier.KNIGHT
    case SubscriptionPlan.master:
      return ModelTier.MASTER
    case SubscriptionPlan.jedi:
      return ModelTier.JEDI
    default:
      return ModelTier.APPRENTICE
  }
}
