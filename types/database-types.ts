/**
 * Base interface for models with user ownership
 */
export interface UserOwnedModel {
  id: string
  userId: string
}

/**
 * Configuration for database operations
 */
export interface DbOperationConfig {
  /** Context string for error logging */
  context?: string
  /** Whether to verify user ownership (default: true) */
  verifyOwnership?: boolean
  /** Include relationships in queries */
  include?: Record<string, any>
  /** Select specific fields */
  select?: Record<string, any>
  /** Custom ordering for queries */
  orderBy?: Record<string, any> | Array<Record<string, any>>
}

/**
 * Result type for database operations - proper discriminated union
 */
export type DbOperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number
  limit: number
  skip?: number
}