/**
 * Shared interface for client context selection across AI services
 * Allows users to choose which client information to include in AI generation
 */
export interface ClientContextSelection {
  country: boolean
  general_context: boolean
}

/**
 * Default client context selections for different service types
 */
export const defaultClientContextSelections = {
  // General marketing context (most common)
  general: {
    country: true,
    general_context: true,
  } as ClientContextSelection,
  
  // Meeting-focused context (for meeting reports)
  meeting: {
    country: false,
    general_context: false,
  } as ClientContextSelection,
} 