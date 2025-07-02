/**
 * Centralized database-related type definitions to establish single source of truth
 * for all database operations, queries, and data structures.
 */

import { OperationResult } from './api-types'

// =============================================================================
// BASE DATABASE INTERFACES
// =============================================================================

/**
 * Base interface for models with user ownership
 */
export interface UserOwnedModel {
  id: string
  userId: string
}

/**
 * Base interface for models with timestamps
 */
export interface TimestampedModel {
  createdAt: Date
  updatedAt: Date
}

/**
 * Base interface for models with both user ownership and timestamps
 */
export interface BaseModel extends UserOwnedModel, TimestampedModel {}

// =============================================================================
// DATABASE OPERATION TYPES
// =============================================================================

/**
 * Configuration for database operations
 */
export interface DbOperationConfig {
  /** Context string for error logging */
  context?: string
  /** Whether to include related data */
  includeRelations?: boolean
  /** Custom error message */
  errorMessage?: string
  /** Operation timeout in milliseconds */
  timeout?: number
}

/**
 * Database operation result with additional context
 */
export interface DbOperationResult<T = any> extends OperationResult<T> {
  /** Number of records affected */
  affected?: number
  /** Type of operation performed */
  operation?: string
  /** Database execution time in milliseconds */
  executionTime?: number
}

/**
 * Query options for database operations
 */
export interface QueryOptions {
  /** Number of records to skip */
  skip?: number
  /** Maximum number of records to return */
  take?: number
  /** Field to order by */
  orderBy?: Record<string, 'asc' | 'desc'>
  /** Fields to select */
  select?: Record<string, boolean>
  /** Relations to include */
  include?: Record<string, any>
  /** Conditions to filter by */
  where?: Record<string, any>
}

/**
 * Pagination options for database queries
 */
export interface PaginationOptions {
  page: number
  limit: number
  orderBy?: Record<string, 'asc' | 'desc'>
}

/**
 * Search options for database queries
 */
export interface SearchOptions extends QueryOptions {
  /** Search term */
  searchTerm?: string
  /** Fields to search in */
  searchFields?: string[]
  /** Case sensitive search */
  caseSensitive?: boolean
}

// =============================================================================
// DOCUMENT-SPECIFIC TYPES
// =============================================================================

/**
 * Document data for creation/update operations
 */
export interface DocumentData {
  documentName: string
  documentType: string
  content: string
  clientId: string
  documentPath?: string
  startDate?: Date | null
  endDate?: Date | null
  metadata?: Record<string, any>
}

/**
 * Document query options with document-specific filters
 */
export interface DocumentQueryOptions extends QueryOptions {
  clientId?: string
  documentType?: string
  dateRange?: {
    start: Date
    end: Date
  }
  hasContent?: boolean
}

/**
 * Document search options
 */
export interface DocumentSearchOptions extends SearchOptions {
  contentSearch?: boolean
  typeFilter?: string[]
  clientFilter?: string[]
}

// =============================================================================
// CLIENT-SPECIFIC TYPES
// =============================================================================

/**
 * Client data for creation/update operations
 */
export interface ClientData {
  name: string
  email?: string
  phone?: string
  country: string
  language: string
  generalContext?: string
  specifiContext1?: string
  specifiContext2?: string
  specifiContext3?: string
}

/**
 * Client query options with client-specific filters
 */
export interface ClientQueryOptions extends QueryOptions {
  country?: string
  language?: string
  hasContext?: boolean
  searchInContext?: boolean
}

// =============================================================================
// PROMPT-SPECIFIC TYPES
// =============================================================================

/**
 * Prompt data for creation/update operations
 */
export interface PromptData {
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  variables?: string[]
  metadata?: Record<string, any>
}

/**
 * Prompt query options with prompt-specific filters
 */
export interface PromptQueryOptions extends QueryOptions {
  category?: string
  isActive?: boolean
  hasVariables?: boolean
  usageRange?: {
    min: number
    max: number
  }
}

// =============================================================================
// CHAT-SPECIFIC TYPES
// =============================================================================

/**
 * Chat data for creation/update operations
 */
export interface ChatData {
  title: string
  clientId?: string
  contextFields?: string[]
  model?: string
  metadata?: Record<string, any>
}

/**
 * Message data for creation operations
 */
export interface MessageData {
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model?: string
  tokensUsed?: number
  estimatedCost?: number
  metadata?: Record<string, any>
}

// =============================================================================
// USAGE TRACKING TYPES
// =============================================================================

/**
 * Usage tracking data
 */
export interface UsageData {
  userId: string
  year: number
  month: number
  tokensUsed?: number
  conversationsCount?: number
  documentsCount?: number
  estimatedCost?: number
}

/**
 * Usage query options
 */
export interface UsageQueryOptions extends QueryOptions {
  userId?: string
  yearRange?: { start: number; end: number }
  monthRange?: { start: number; end: number }
  aggregateBy?: 'day' | 'week' | 'month' | 'year'
}

// =============================================================================
// AUDIT TRAIL TYPES
// =============================================================================

/**
 * Audit trail data for tracking changes
 */
export interface AuditData {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

// =============================================================================
// BULK OPERATION TYPES
// =============================================================================

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = any> {
  success: boolean
  totalRequested: number
  successful: number
  failed: number
  results: Array<{
    id: string
    success: boolean
    data?: T
    error?: string
  }>
  errors: Array<{
    id: string
    error: string
  }>
}

/**
 * Bulk operation options
 */
export interface BulkOperationOptions {
  /** Whether to continue on individual failures */
  continueOnError?: boolean
  /** Batch size for processing */
  batchSize?: number
  /** Transaction isolation level */
  isolation?: 'serializable' | 'repeatable_read' | 'read_committed' | 'read_uncommitted'
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Maximum time for transaction in milliseconds */
  timeout?: number
  /** Isolation level */
  isolationLevel?: string
  /** Whether to log the transaction */
  logTransaction?: boolean
}

/**
 * Transaction context
 */
export interface TransactionContext {
  id: string
  startTime: Date
  operations: string[]
  userId?: string
}