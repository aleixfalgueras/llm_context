/**
 * Centralized API-related type definitions to establish single source of truth
 * for all API request/response patterns, validation results, and service interfaces.
 */

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Standard validation result interface used across forms and API validation
 * Single source of truth for all validation operations
 */
export interface ValidationResult {
  isValid: boolean
  message?: string
  errors?: Record<string, string>
  firstError?: string
}

/**
 * Extended validation result with detailed field-level errors
 */
export interface DetailedValidationResult extends ValidationResult {
  errors: Record<string, string>
  firstError?: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard success response wrapper for all API endpoints
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

/**
 * Standard error response wrapper for all API endpoints
 */
export interface ApiErrorResponse {
  success: false
  error: string
  details?: Record<string, any>
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Generic API response for operations that return data
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/**
 * Standard pagination parameters for API requests
 */
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

/**
 * Standard pagination response metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationMeta
}

// =============================================================================
// REQUEST CONTEXT TYPES
// =============================================================================

/**
 * Client information extracted from request headers for audit trails
 */
export interface ClientInfo {
  ipAddress: string
  userAgent: string
}

/**
 * Standard request context passed to API handlers
 */
export interface RequestContext {
  userId: string
  clientInfo?: ClientInfo
  timestamp: Date
}

// =============================================================================
// OPERATION RESULT TYPES
// =============================================================================

/**
 * Standard result interface for operations that may succeed or fail
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

/**
 * Database operation result with additional context
 */
export interface DbOperationResult<T = any> extends OperationResult<T> {
  affected?: number
  operation?: string
}

// =============================================================================
// AI SERVICE TYPES
// =============================================================================

/**
 * Standard AI service request interface
 */
export interface AIServiceRequest {
  model?: string
  prompt: string
  context?: Record<string, any>
  options?: Record<string, any>
}

/**
 * Standard AI service response interface
 */
export interface AIServiceResponse {
  content: string
  tokensUsed?: number
  model?: string
  metadata?: Record<string, any>
}

// =============================================================================
// DOCUMENT SERVICE TYPES
// =============================================================================

/**
 * Document creation request interface
 */
export interface DocumentCreateRequest {
  clientId: string
  documentName: string
  documentType: string
  content: string
  metadata?: Record<string, any>
}

/**
 * Document creation response interface
 */
export interface DocumentCreateResponse {
  document: {
    id: string
    documentName: string
    documentPath: string
    documentType: string
  }
  message: string
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if API response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Type guard to check if API response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false
}

/**
 * Type guard to check if operation result is successful
 */
export function isOperationSuccess<T>(result: OperationResult<T>): result is OperationResult<T> & { success: true; data: T } {
  return result.success === true && result.data !== undefined
}