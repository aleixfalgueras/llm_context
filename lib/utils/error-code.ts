import { ApiSubscriptionErrorCode } from '@/lib/types/enums'

/**
 * Shared error handling utilities to eliminate duplication between 
 * client-side toast notifications and server-side API responses
 */

export interface ErrorData {
  code?: string
  error?: string
  message?: string
  upgradeUrl?: string
  metadata?: {
    used?: number
    limit?: number
    remaining?: number
    plan?: string
    [key: string]: any
  }
}

export interface ErrorMetadata {
  isUserLimitError: boolean
  isSubscriptionError: boolean
  shouldLogAsInfo: boolean
  upgradeUrl?: string
  usageInfo?: {
    used: number
    limit: number
    remaining: number
  }
  plan?: string
}

/**
 * Extracts metadata from error data based on error code
 */
export function getErrorMetadata(errorData: ErrorData): ErrorMetadata {
  const code = errorData.code
  
  switch (code) {
    case ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED:
      return {
        isUserLimitError: true,
        isSubscriptionError: true,
        shouldLogAsInfo: true,
        usageInfo: {
          used: errorData.metadata?.used || 0,
          limit: errorData.metadata?.limit || 0,
          remaining: errorData.metadata?.remaining || 0
        }
      }
    
    case ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED:
      return {
        isUserLimitError: false,
        isSubscriptionError: true,
        shouldLogAsInfo: true,
        upgradeUrl: errorData.upgradeUrl,
        plan: errorData.metadata?.plan
      }
    
    case ApiSubscriptionErrorCode.MODEL_ACCESS_DENIED:
      return {
        isUserLimitError: false,
        isSubscriptionError: true,
        shouldLogAsInfo: false
      }
    
    case ApiSubscriptionErrorCode.NO_SUBSCRIPTION_FOUND:
      return {
        isUserLimitError: false,
        isSubscriptionError: true,
        shouldLogAsInfo: true
      }
    
    default:
      return {
        isUserLimitError: false,
        isSubscriptionError: false,
        shouldLogAsInfo: false
      }
  }
}

/**
 * Gets user-friendly error message based on error code and data
 */
export function getErrorMessage(errorData: ErrorData): string {
  const code = errorData.code
  const message = errorData.error || errorData.message
  
  switch (code) {
    case ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED:
      return message || 'Usage limit exceeded. Please upgrade your plan to continue.'
    
    case ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED:
      return 'Your subscription has expired. Please upgrade to continue using write features. Read-only access is still available.'
    
    case ApiSubscriptionErrorCode.MODEL_ACCESS_DENIED:
      return message || 'Model access denied. Please upgrade your plan to continue.'
    
    case ApiSubscriptionErrorCode.NO_SUBSCRIPTION_FOUND:
      return message || 'No active subscription found. Please upgrade to access billing portal.'
    
    default:
      return message || 'An error occurred'
  }
}

/**
 * Checks if an error code represents a user limit error
 */
export function isUserLimitError(code?: string): boolean {
  return code === ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED
}

/**
 * Checks if an error code represents a subscription-related error
 */
export function isSubscriptionError(code?: string): boolean {
  return code === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED ||
         code === ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED ||
         code === ApiSubscriptionErrorCode.MODEL_ACCESS_DENIED
}

/**
 * Determines if an error should be logged as INFO instead of ERROR
 */
export function shouldLogAsInfo(code?: string): boolean {
  return code === ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED ||
         code === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED ||
         code === ApiSubscriptionErrorCode.NO_SUBSCRIPTION_FOUND
}

/**
 * Extracts error data from various error formats
 */
export function normalizeErrorData(error: any): ErrorData {
  // Handle Response objects
  if (error && typeof error.json === 'function') {
    throw new Error('Response objects should be processed with .json() before calling this function')
  }
  
  // Handle plain objects with error data
  if (typeof error === 'object' && error !== null) {
    return {
      code: error.code,
      error: error.error || error.message,
      message: error.message || error.error,
      upgradeUrl: error.upgradeUrl,
      metadata: error.metadata
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      error: error,
      message: error
    }
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    return {
      error: error.message,
      message: error.message,
      code: (error as any).code
    }
  }
  
  // Fallback for unknown error types
  return {
    error: 'An unknown error occurred',
    message: 'An unknown error occurred'
  }
}