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

