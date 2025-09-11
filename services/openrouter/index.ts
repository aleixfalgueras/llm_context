/**
 * OpenRouter service exports
 */

export { OpenRouterService } from './openrouter-service'

export {processOpenRouterStream} from "@/services/openrouter/openrouter-service";

// Singleton instance for convenience
import { OpenRouterService } from './openrouter-service'
export const openRouterService = new OpenRouterService()