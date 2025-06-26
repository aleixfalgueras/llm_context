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
export const DEFAULT_MAX_TOKENS = 1000
export const DEFAULT_PRESENCE_PENALTY = 0.1
export const DEFAULT_FREQUENCY_PENALTY = 0.1

// AI Services specific defaults (higher token limits for document generation)
export const AI_SERVICES_DEFAULT_MAX_TOKENS = 2000

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
 * Get the default max tokens, with optional environment override
 */
export function getDefaultMaxTokens(useAIServicesDefault = false): number {
  const defaultValue = useAIServicesDefault ? AI_SERVICES_DEFAULT_MAX_TOKENS : DEFAULT_MAX_TOKENS
  return parseInt(process.env.OPENAI_MAX_TOKENS || defaultValue.toString())
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