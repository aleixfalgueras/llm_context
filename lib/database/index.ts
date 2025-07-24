/**
 * Database operations exports
 */

export { BaseOperations } from './base-operations'
export { ChatOperations } from './chat-operations'
export { ClientOperations } from './client-operations'
export { DocumentOperations } from './document-operations'
export { MessageOperations } from './message-operations'
export { PromptOperations } from './prompt-operations'
export { SubscriptionOperations } from './subscription-operations'

export type {
  UserOwnedModel,
  DbOperationConfig,
  DbOperationResult,
  PaginationConfig
} from './base-operations'

// Legacy exports for backward compatibility
export { BaseOperations as DatabaseOperations } from './base-operations'