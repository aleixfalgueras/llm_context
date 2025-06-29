export interface AIModel {
  id: string
  name: string
  description: string
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'other'
  contextLength?: number
  pricing?: { input: number; output: number }
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

// Create array of all model IDs for validation  
export const ALL_MODEL_IDS = Object.values(MODEL_IDS) as string[]

export const AVAILABLE_MODELS: AIModel[] = [
  // OpenAI models via OpenRouter
  {
    id: MODEL_IDS.OPENAI_GPT_4O,
    name: 'GPT-4o',
    description: 'Most capable OpenAI model, best for complex tasks',
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 0.0025, output: 0.01 }
  },
  {
    id: MODEL_IDS.OPENAI_GPT_4O_MINI,
    name: 'GPT-4o Mini',
    description: 'Faster and more cost-effective OpenAI model',
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 0.00015, output: 0.0006 }
  },
  {
    id: MODEL_IDS.OPENAI_GPT_4_TURBO,
    name: 'GPT-4 Turbo',
    description: 'High-performance OpenAI model with large context',
    provider: 'openai',
    contextLength: 128000,
    pricing: { input: 0.01, output: 0.03 }
  },
  // Anthropic models via OpenRouter
  {
    id: MODEL_IDS.ANTHROPIC_CLAUDE_3_5_SONNET,
    name: 'Claude 3.5 Sonnet',
    description: 'High-performance Claude model with exceptional reasoning',
    provider: 'anthropic',
    contextLength: 200000,
    pricing: { input: 0.003, output: 0.015 }
  },
  {
    id: MODEL_IDS.ANTHROPIC_CLAUDE_3_HAIKU,
    name: 'Claude 3 Haiku',
    description: 'Fastest and most cost-effective Claude model',
    provider: 'anthropic',
    contextLength: 200000,
    pricing: { input: 0.00025, output: 0.00125 }
  },
  {
    id: MODEL_IDS.ANTHROPIC_CLAUDE_3_OPUS,
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model for complex reasoning',
    provider: 'anthropic',
    contextLength: 200000,
    pricing: { input: 0.015, output: 0.075 }
  },
  // Google models via OpenRouter
  {
    id: MODEL_IDS.GOOGLE_GEMINI_PRO,
    name: 'Gemini Pro',
    description: 'Google\'s flagship model for text and reasoning',
    provider: 'google',
    contextLength: 32000,
    pricing: { input: 0.0005, output: 0.0015 }
  },
  {
    id: MODEL_IDS.GOOGLE_GEMINI_FLASH,
    name: 'Gemini Flash',
    description: 'Fast and efficient Google model',
    provider: 'google',
    contextLength: 32000,
    pricing: { input: 0.00025, output: 0.00075 }
  },
  // Meta models via OpenRouter
  {
    id: MODEL_IDS.META_LLAMA_3_1_405B,
    name: 'Llama 3.1 405B',
    description: 'Meta\'s largest and most capable open-source model',
    provider: 'meta',
    contextLength: 32000,
    pricing: { input: 0.005, output: 0.005 }
  },
  {
    id: MODEL_IDS.META_LLAMA_3_1_70B,
    name: 'Llama 3.1 70B',
    description: 'High-performance open-source model from Meta',
    provider: 'meta',
    contextLength: 32000,
    pricing: { input: 0.0009, output: 0.0009 }
  },
  // Other notable models
  {
    id: MODEL_IDS.PERPLEXITY_SONAR_HUGE,
    name: 'Perplexity Sonar Huge (Online)',
    description: 'Web-connected model with real-time information access',
    provider: 'other',
    contextLength: 128000,
    pricing: { input: 0.005, output: 0.005 }
  }
]

// OpenRouter Configuration Constants
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