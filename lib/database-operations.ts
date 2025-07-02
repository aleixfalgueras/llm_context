/**
 * @deprecated Use individual database operation classes from ./database/ instead
 * This file is maintained for backward compatibility but will be removed in future versions.
 * 
 * Migrated to:
 * - BaseOperations from './database/base-operations'
 * - ClientOperations from './database/client-operations'
 * - DocumentOperations from './database/document-operations'
 * - PromptOperations from './database/prompt-operations'
 */

export {
  BaseOperations as DatabaseOperations,
  ClientOperations,
  DocumentOperations,
  PromptOperations
} from './database'

export type {
  UserOwnedModel,
  DbOperationConfig,
  DbOperationResult,
  PaginationConfig
} from './database'