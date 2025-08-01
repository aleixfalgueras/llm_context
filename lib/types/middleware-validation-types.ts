/**
 * Validation error details for middleware error handling
 */
export interface ValidationErrorDetails {
  code: string
  status: number
  message: string
  metadata: {
    limitType: string
    used: number
    limit: number
    remaining?: number
    upgradeUrl: string
  }
}

/**
 * Base usage validation result structure
 * Common fields for all usage validation results
 */
export interface UsageValidationResult {
  allowed: boolean
  used: number
  limit: number
  remaining?: number
  limitType: string
}

/**
 * Token validation result structure
 * Standardized result from token usage validation
 */
export interface TokenUsageValidationResult extends UsageValidationResult {
  limitType: 'tokens'
  reason?: string
}

/**
 * Storage validation result structure
 */
export interface StorageUsageValidationResult extends UsageValidationResult {
  limitType: 'storage'
  message?: string
}
