/**
 * Shared interface for client context selection across AI services
 * Allows users to choose which client information to include in AI generation
 */
export interface ClientContextSelection {
  country: boolean
  general_context: boolean
  specific_context_1: boolean
  specific_context_2: boolean
  specific_context_3: boolean
}

/**
 * Default client context selections for different service types
 */
export const defaultClientContextSelections = {
  // General marketing context (most common)
  general: {
    country: true,
    general_context: true,
    specific_context_1: false,
    specific_context_2: false,
    specific_context_3: false,
  } as ClientContextSelection,
  
  // Meeting-focused context (for meeting reports)
  meeting: {
    country: false,
    general_context: false,
    specific_context_1: false,
    specific_context_2: false,
    specific_context_3: false,
  } as ClientContextSelection,
} 