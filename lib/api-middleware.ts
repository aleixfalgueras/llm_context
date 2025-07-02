import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit } from './subscription-utils'
import { createUsageLimitResponse } from './ai-wrapper'
import { handleApiError, ApiErrors } from './api-error-handler'

export interface ApiMiddlewareResult {
  success: boolean
  userId?: string
  response?: Response
}

// Action types that require usage checking
export type ActionType = 'client'

/**
 * Unified middleware for API authentication and usage enforcement
 */
export async function withAuthAndUsageCheck(
  action: ActionType
): Promise<ApiMiddlewareResult> {
  try {
    // Check authentication
    const { userId } = await auth()
    
    if (!userId) {
      return {
        success: false,
        response: new Response('Unauthorized', { status: 401 })
      }
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(userId, action)

    if (!usageCheck.allowed) {
      return {
        success: false,
        response: createUsageLimitResponse(
          action, 
          usageCheck.limit as number | "unlimited",
          (usageCheck as any).limitType,
          (usageCheck as any).used
        )
      }
    }

    return {
      success: true,
      userId
    }
  } catch (error) {
    console.error('Error in API middleware:', error)
    return {
      success: false,
      response: new Response('Internal Server Error', { status: 500 })
    }
  }
}

/**
 * Helper to track usage after successful API completion
 */
export async function trackApiUsage(
  userId: string,
  metadata?: Record<string, any>
) {
  try {
    const { trackUsage } = await import('./usage-middleware')
    await trackUsage(userId, metadata)
  } catch (error) {
    console.error('Error tracking API usage:', error)
    // Don't throw - usage tracking failures shouldn't break the API
  }
}

/**
 * Wrapper for API routes that need authentication and usage checking
 */
export function withUsageEnforcement(
  action: ActionType,
  handler: (userId: string, request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    const middleware = await withAuthAndUsageCheck(action)
    
    if (!middleware.success) {
      return middleware.response!
    }

    return handler(middleware.userId!, request)
  }
}

// =============================================================================
// ENHANCED API MIDDLEWARE FOR DRY ELIMINATION
// =============================================================================

/**
 * Request context passed to API handlers
 */
export interface ApiContext {
  userId: string
  req: NextRequest
  params?: Record<string, string | string[]>
}

/**
 * Configuration for enhanced API middleware
 */
export interface EnhancedApiConfig {
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean
  /** Usage action type for subscription enforcement */
  usageAction?: ActionType
  /** Context string for error logging */
  context?: string
  /** Method validation */
  allowedMethods?: string[]
  /** Content-Type validation */
  expectedContentType?: string
}

/**
 * Enhanced API handler function type
 */
export type EnhancedApiHandler<T = any> = (
  context: ApiContext
) => Promise<NextResponse<T>> | NextResponse<T>

/**
 * Enhanced API middleware that consolidates auth, usage checking, error handling,
 * and common response patterns. Eliminates duplicate code across API routes.
 * 
 * @example
 * ```typescript
 * export const GET = withEnhancedApi(async ({ userId, req }) => {
 *   const data = await fetchUserData(userId)
 *   return apiSuccess(data)
 * }, { context: 'Fetch User Data' })
 * 
 * export const POST = withEnhancedApi(async ({ userId, req }) => {
 *   const body = await parseJsonBody(req)
 *   const result = await createResource(userId, body)
 *   return apiSuccess(result, 201)
 * }, { 
 *   context: 'Create Resource',
 *   usageAction: 'client',
 *   allowedMethods: ['POST'],
 *   expectedContentType: 'application/json'
 * })
 * ```
 */
export function withEnhancedApi<T = any>(
  handler: EnhancedApiHandler<T>,
  config: EnhancedApiConfig = {}
) {
  const {
    requireAuth = true,
    usageAction,
    context = 'API operation',
    allowedMethods,
    expectedContentType
  } = config

  return async (
    req: NextRequest,
    { params }: { params?: Record<string, string | string[]> } = {}
  ): Promise<NextResponse> => {
    try {
      // Method validation
      if (allowedMethods && !allowedMethods.includes(req.method)) {
        return ApiErrors.badRequest(`Method ${req.method} not allowed`)
      }

      // Content-Type validation
      if (expectedContentType && req.method !== 'GET') {
        const contentType = req.headers.get('content-type')
        if (contentType && !contentType.includes(expectedContentType)) {
          return ApiErrors.badRequest(`Expected content-type: ${expectedContentType}`)
        }
      }

      // Authentication and usage checking
      let userId = ''
      if (requireAuth) {
        if (usageAction) {
          // Use existing usage enforcement middleware
          const middleware = await withAuthAndUsageCheck(usageAction)
          if (!middleware.success) {
            return new NextResponse(middleware.response?.body, {
              status: middleware.response?.status,
              headers: middleware.response?.headers
            })
          }
          userId = middleware.userId!
        } else {
          // Simple auth check
          const { userId: authUserId } = await auth()
          if (!authUserId) {
            return ApiErrors.unauthorized()
          }
          userId = authUserId
        }
      }

      // Create context and call handler
      const apiContext: ApiContext = {
        userId,
        req,
        params
      }

      return await handler(apiContext)
    } catch (error) {
      return handleApiError(error, { context })
    }
  }
}

/**
 * Middleware for public API routes (no authentication required)
 */
export function withPublicApi<T = any>(
  handler: EnhancedApiHandler<T>,
  config: Omit<EnhancedApiConfig, 'requireAuth' | 'usageAction'> = {}
) {
  return withEnhancedApi(handler, { ...config, requireAuth: false })
}

/**
 * Standard success response helper
 */
export function apiSuccess<T = any>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<{ data: T; success: true }> {
  return NextResponse.json(
    { data, success: true },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}

/**
 * Success response for created resources
 */
export function apiCreated<T = any>(
  data: T,
  headers?: Record<string, string>
): NextResponse<{ data: T; success: true }> {
  return apiSuccess(data, 201, headers)
}

/**
 * Success response with no content
 */
export function apiNoContent(
  headers?: Record<string, string>
): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T = any>(
  req: NextRequest
): Promise<T> {
  try {
    return await req.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

/**
 * Extract pagination parameters from URL search params
 */
export function extractPagination(
  req: NextRequest,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number } {
  const searchParams = req.nextUrl.searchParams
  
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 10))))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
} 