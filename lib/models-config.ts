export interface AIModel {
  id: string
  name: string
  description: string
  provider: 'openai' | 'anthropic'
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable OpenAI model, best for complex tasks',
    provider: 'openai'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Faster and more cost-effective OpenAI model',
    provider: 'openai'
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    description: 'Most capable Claude model for complex reasoning and analysis',
    provider: 'anthropic'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    description: 'High-performance Claude model with exceptional reasoning capabilities',
    provider: 'anthropic'
  },

  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fastest and most cost-effective Claude model',
    provider: 'anthropic'
  }
]

// OpenAI Configuration Constants
export const DEFAULT_MODEL = 'gpt-4o-mini'
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_PRESENCE_PENALTY = 0.1
export const DEFAULT_FREQUENCY_PENALTY = 0.1

// Consistent max tokens limit across all AI providers
// Large enough to avoid cutting responses, but prevents extremely long outputs
export const DEFAULT_MAX_TOKENS = 8000

/**
 * Get the default model, with optional environment override
 * Environment variable: OPENAI_API_DEFAULT_MODEL
 */
export function getDefaultModel(): string {
  return process.env.OPENAI_API_DEFAULT_MODEL || DEFAULT_MODEL
}

/**
 * Get the default temperature, with optional environment override
 */
export function getDefaultTemperature(): number {
  return parseFloat(process.env.OPENAI_TEMPERATURE || DEFAULT_TEMPERATURE.toString())
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
  return parseFloat(process.env.OPENAI_PRESENCE_PENALTY || DEFAULT_PRESENCE_PENALTY.toString())
}

/**
 * Get the default frequency penalty, with optional environment override
 */
export function getDefaultFrequencyPenalty(): number {
  return parseFloat(process.env.OPENAI_FREQUENCY_PENALTY || DEFAULT_FREQUENCY_PENALTY.toString())
}

export function getModelById(modelId: string): AIModel | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId)
}

export function getModelDisplayName(modelId: string): string {
  const model = getModelById(modelId)
  return model?.name || modelId
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
    // Validate model before saving
    const isValidModel = AVAILABLE_MODELS.some(model => model.id === modelId)
    if (isValidModel) {
      localStorage.setItem('chat-default-model', modelId)
    } else {
      console.error('Attempted to save invalid model as default:', modelId)
    }
  } catch (error) {
    console.error('Failed to save default model to localStorage:', error)
  }
} 