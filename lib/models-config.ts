import {ModelTier, ModelTierType} from '@/lib/types/subscription-types'

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
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'perplexity'
  contextLength?: number
  pricing?: { input: number; output: number, imageInput?: number, imageOutput?: number }
}

export const MODEL_IDS = {
  GOOGLE_GEMINI_2_0_FLASH: 'google/gemini-2.0-flash-001',
  GOOGLE_GEMINI_2_5_PRO: 'google/gemini-2.5-pro',
  GOOGLE_GEMINI_2_5_FLASH_IMAGE: 'google/gemini-2.5-flash-image-preview',
  OPENAI_GPT_5_NANO: 'openai/gpt-5-nano',
  OPENAI_GPT_5_CHAT: 'openai/gpt-5-chat',
  PERPLEXITY: 'perplexity/sonar-reasoning'
} as const

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    name: 'Gemini 2.0',
    description: "gemini_eco",
    provider: 'google',
    contextLength: 1000000,
    pricing: { input: 0.1, output: 0.4 },
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_5_PRO,
    name: 'Gemini 2.5 PRO',
    description: "gemini_pro",
    provider: 'google',
    contextLength: 1048576,
    pricing: { input: 1.25, output: 10 },
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE,
    name: 'Gemini 2.5 Image',
    description: "gemini_image",
    provider: 'google',
    contextLength: 32768,
    pricing: { input: 0.3, output: 2.5, imageInput: 1.238, imageOutput: 0.03 },
  },
  {
    id: MODEL_IDS.OPENAI_GPT_5_NANO,
    name: 'ChatGPT 5 Nano',
    description: "chatgpt_eco",
    provider: 'openai',
    contextLength: 400000,
    pricing: { input: 0.05, output: 0.4 },
  },
  {
    id: MODEL_IDS.OPENAI_GPT_5_CHAT,
    name: 'ChatGPT 5',
    description: "chatgpt_pro",
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 1.25, output: 10 },
  },
  {
    id: MODEL_IDS.PERPLEXITY,
    name: 'Perplexity: Sonar Reasoning',
    description: "perplexity",
    provider: 'perplexity',
    contextLength: 125000,
    pricing: { input: 1, output: 5 },
  }
]

// Essential (budget-friendly) models
export const ESSENTIAL_MODEL_IDS = [
  MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
  MODEL_IDS.OPENAI_GPT_5_NANO
]

// Helper function to check if a model is essential (budget-friendly)
export const isEssentialModel = (modelId: string): boolean => {
  return ESSENTIAL_MODEL_IDS.includes(modelId)
}

export const IMAGE_GENERATION_MODEL_ID = MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE

export const MODEL_TIERS = {
  [ModelTier.APPRENTICE]: Object.values(MODEL_IDS),
  [ModelTier.KNIGHT]: Object.values(MODEL_IDS),
  [ModelTier.MASTER]: Object.values(MODEL_IDS),
  [ModelTier.JEDI]: Object.values(MODEL_IDS),
}

// OpenRouter Configuration Constants
export const DEFAULT_MODEL = MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_PRESENCE_PENALTY = 0.1
export const DEFAULT_FREQUENCY_PENALTY = 0.1

// Consistent max tokens limit across all AI providers
// Large enough to avoid cutting responses, but prevents extremely long outputs
export const DEFAULT_MAX_TOKENS = 8000

