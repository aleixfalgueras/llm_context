/**
 * Token validation result structure
 * Standardized result from token usage validation
 */
export interface TokenValidationResult {
  allowed: boolean
  limitType: 'tokens'
  used: number
  limit: number
  remaining?: number
  reason?: string
}

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