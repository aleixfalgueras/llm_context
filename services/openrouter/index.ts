/**
 * OpenRouter service exports
 */

export { OpenRouterService } from './openrouter-service'
export { processOpenRouterStream, streamToString } from './stream-handler'

// Singleton instance for convenience
import { OpenRouterService } from './openrouter-service'
export const openRouterService = new OpenRouterService()