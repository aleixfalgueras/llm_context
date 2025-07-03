import { NextResponse } from 'next/server'
import { AIProviderError } from '@/lib/ai-errors'
import { logger } from './logger'

/**
 * Centralized API error handler to eliminate duplicate error handling patterns
 * across API routes. Provides consistent error responses and logging.
 */

export interface ApiErrorOptions {
  /** Context or operation name for logging */
  context?: string
  /** Whether to log the full error (default: true) */
  logError?: boolean
  /** Custom error message for generic errors */
  fallbackMessage?: string
}

/**
 * Handles API errors with consistent formatting and logging
 */
export function handleApiError(
  error: unknown, 
  options: ApiErrorOptions = {}
): NextResponse {
  const { 
    context = 'API operation', 
    logError = true, 
    fallbackMessage = 'Internal server error' 
  } = options

  if (logError) {
    if (error instanceof AIProviderError) {
      logger.aiError(error.provider || 'unknown', error, { operation: context })
    } else {
      logger.error(`Error in ${context}`, error as Error, { operation: context })
    }
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

/**
 * Wraps an async API handler function with automatic error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error, { context })
    }
  }
}

/**
 * Common API error responses for specific scenarios
 */
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

/**
 * Validates authentication and returns standardized error if not authenticated
 */
export function requireAuth(userId: string | null | undefined): NextResponse | null {
  if (!userId) {
    return ApiErrors.unauthorized()
  }
  return null
}