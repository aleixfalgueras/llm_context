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
