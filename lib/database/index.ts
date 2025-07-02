/**
 * Database operations exports
 */

export { BaseOperations } from './base-operations'
export { ClientOperations } from './client-operations'
export { DocumentOperations } from './document-operations'
export { PromptOperations } from './prompt-operations'

export type {
  UserOwnedModel,
  DbOperationConfig,
  DbOperationResult,
  PaginationConfig
} from './base-operations'

// Legacy exports for backward compatibility
export { BaseOperations as DatabaseOperations } from './base-operations'