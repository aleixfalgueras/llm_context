/**
 * Unified Error Handler
 * Combines provider error handling and API response formatting
 */

import {NextResponse} from 'next/server'
import {AIProviderError} from '../ai/errors'
import {logger} from '../logger'
import {ApiSubscriptionErrorCode} from '@/types/enums'
import {getErrorMetadata, normalizeErrorData} from './error-code'

export interface ApiErrorOptions {
  /** Context or operation name for logging */
  context?: string
  /** Whether to log the full error (default: true) */
  logError?: boolean
  /** Custom error message for generic errors */
  fallbackMessage?: string
  /** User ID for context logging */
  userId?: string
  /** Resource ID (chatId, clientId, etc.) for context logging */
  resourceId?: string
  /** Operation name for logging */
  operation?: string
  /** Optional cleanup function to run before returning */
  cleanup?: () => void
}

/**
 * Unified API error handler that formats any error into consistent HTTP responses
 */
export function handleApiError(
  error: unknown, 
  options: ApiErrorOptions = {}
): NextResponse {
  const { 
    context = 'API operation', 
    logError = true, 
    fallbackMessage = 'Internal server error',
    userId,
    resourceId,
    operation,
    cleanup
  } = options

  // Execute cleanup function if provided
  if (cleanup) {
    cleanup()
  }

  // Build logging context
  const logContext: Record<string, any> = {}
  if (userId) logContext.userId = userId
  if (resourceId) logContext[operation === 'chat' ? 'chatId' : 'clientId'] = resourceId
  if (operation) logContext.operation = operation

  if (logError) {
    // Normalize error data for consistent handling
    const errorData = error instanceof AIProviderError ? null : normalizeErrorData(error)
    const errorMetadata = errorData ? getErrorMetadata(errorData) : null
    
    // Handle expected user limit errors as INFO instead of ERROR
    if (errorData && errorMetadata?.shouldLogAsInfo) {
      if (errorData.code === ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED) {
        logger.info('User reached token limit', { 
          ...logContext,
          metadata: errorMetadata.usageInfo
        });
      } else if (errorData.code === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED) {
        logger.info('User subscription expired', { 
          ...logContext,
          metadata: {
            plan: errorMetadata.plan
          }
        });
      } else if (errorData.code === ApiSubscriptionErrorCode.NO_SUBSCRIPTION_FOUND) {
        logger.info('User attempted to access billing portal without subscription', { 
          ...logContext,
          metadata: {
            message: 'Expected behavior for free trial users'
          }
        });
      }
    } else if (error instanceof AIProviderError) {
      logger.aiError(error.provider || 'unknown', error, logContext)
    } else {
      logger.error(`Error in ${context}`, error as Error, logContext)
    }
  }

  // Handle structured middleware errors (auth, token validation, etc.)
  if (error instanceof Error && (error as any).code && (error as any).status) {
    return NextResponse.json(
      {
        error: error.message,
        code: (error as any).code,
        ...(error as any).metadata
      },
      { status: (error as any).status }
    )
  }

  // Handle AI provider errors with specific formatting
  if (error instanceof AIProviderError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider,
        type: error.type,
        retryAfter: error.retryAfter
      },
      { status: error.statusCode || 500 }
    )
  }

  // Handle known Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500 }
  )
}

// =============================================================================
// COMMON API ERROR RESPONSES
// =============================================================================

export const ApiErrors = {
  unauthorized: () => NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  ),

  forbidden: (message = 'Access denied') => NextResponse.json(
    { error: message },
    { status: 403 }
  ),

  badRequest: (message = 'Invalid request') => NextResponse.json(
    { error: message },
    { status: 400 }
  ),

  notFound: (resource = 'Resource') => NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  ),

  conflict: (message = 'Resource already exists') => NextResponse.json(
    { error: message },
    { status: 409 }
  ),

  tooManyRequests: (message = 'Rate limit exceeded') => NextResponse.json(
    { error: message },
    { status: 429 }
  ),

  payloadTooLarge: (message = 'File too large') => NextResponse.json(
    { error: message },
    { status: 413 }
  )
}