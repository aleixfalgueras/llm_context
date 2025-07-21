import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@clerk/nextjs/server'
import {ApiErrors, handleApiError} from '../utils/error-handler'

/**
 * Request context passed to API handlers:
 * Defines the information that gets passed to your API handler.
 */
export interface ApiContext {
  userId: string
  req: NextRequest
  params?: Record<string, string | string[]>
}

/**
 * Enhanced API handler function type:
 * Defines what your actual API function should look like
 */
export type EnhancedApiHandler<T = any> = (
  context: ApiContext
) => Promise<NextResponse<T | { error: string }>> | NextResponse<T | { error: string }>


/**
 * Configuration for enhanced API middleware:
 * Defines how your API endpoint should behave
 */
export interface EnhancedApiConfig {
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean
  /** Context string for error logging */
  context?: string
  /** Method validation */
  allowedMethods?: string[]
  /** Content-Type validation */
  expectedContentType?: string
}

/**
 * Enhanced API middleware that consolidates auth, usage checking, error handling,
 * and common response patterns. Eliminates duplicate code across API routes.
 */
export function withEnhancedApi<T = any>(
  handler: EnhancedApiHandler<T>,
  config: EnhancedApiConfig = {}
) {
  const {
    requireAuth = true,
    context = 'API operation',
    allowedMethods,
    expectedContentType
  } = config

  return async (
    req: NextRequest,
    { params }: { params?: Promise<Record<string, string | string[]>> } = {}
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
        // Simple auth check (removed old usage enforcement)
        const { userId: authUserId } = await auth()
        if (!authUserId) {
          return ApiErrors.unauthorized()
        }
        userId = authUserId
      }

      // Create context and call handler
      const resolvedParams = params ? await params : undefined
      
      const apiContext: ApiContext = {
        userId,
        req,
        params: resolvedParams
      }

      return await handler(apiContext)
    } catch (error) {
      return handleApiError(error, { context })
    }
  }
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
