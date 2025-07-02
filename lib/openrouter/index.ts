/**
 * OpenRouter module exports
 */

export { OpenRouterClient } from './client'
export { OpenRouterService } from './service'
export { handleOpenRouterError } from './error-handler'
export { processOpenRouterStream, streamToString } from './stream-handler'

export type {
  OpenRouterCompletionOptions,
  StreamChunk
} from './client'

export type {
  UsageTrackingOptions
} from './service'

// Default service instance for convenience
import { OpenRouterService } from './service'
export const openRouterService = new OpenRouterService()