/**
 * Simplified Error Handler
 * Handles all API errors with consistent responses
 */

import {NextResponse} from 'next/server'
import {logger} from '../logger'

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
 * Simplified API error handler that returns consistent HTTP responses
 * - Propagates error messages directly to the UI
 * - All errors return 500 status for simplicity
 * - Business error codes (like SubscriptionErrorCode) are passed through as messages
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

  if (cleanup) {
    cleanup()
  }

  // Build logging context
  const logContext: Record<string, any> = {}
  if (userId) logContext.userId = userId
  if (resourceId) logContext[operation === 'chat' ? 'chatId' : 'clientId'] = resourceId
  if (operation) logContext.operation = operation


  if (logError) {
    logger.error(`Error in ${context}`, error as Error, logContext)
  }


  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500 }
  )
}

// COMMON API ERROR RESPONSES
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