import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { handleApiError, ApiErrors } from './error-handler'

export interface UsageLimitResponse {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
  message?: string
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
) => Promise<NextResponse<T | { error: string }>> | NextResponse<T | { error: string }>

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
 * Middleware for public API routes (no authentication required)
 */
export function withPublicApi<T = any>(
  handler: EnhancedApiHandler<T>,
  config: Omit<EnhancedApiConfig, 'requireAuth'> = {}
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

/**
 * Extract client IP and user agent for audit trails
 * Eliminates duplicate code across routes that need this information
 */
export function extractClientInfo(req: NextRequest): { 
  ipAddress: string; 
  userAgent: string 
} {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   req.ip ||
                   'unknown'
  
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}

// =============================================================================
// COMPOSABLE MIDDLEWARE FUNCTIONS (New Simplified Approach)
// =============================================================================

/**
 * Simple authentication middleware - returns userId or throws error
 */
export async function withAuth(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }
  
  return userId
}

/**
 * Token usage validation middleware - checks monthly token limits
 */
export async function withTokenValidation(userId: string): Promise<void> {
  const { checkTokenUsageLimit } = await import('../payments/subscription-utils')
  
  const tokenUsage = await checkTokenUsageLimit(userId)
  
  if (!tokenUsage.allowed) {
    const error = new Error(
      tokenUsage.reason === 'SUBSCRIPTION_EXPIRED' 
        ? 'Your subscription has expired. Please upgrade to continue using AI features.'
        : `You've reached your monthly token limit of ${tokenUsage.limit.toLocaleString()} tokens. You've used ${tokenUsage.used.toLocaleString()} tokens this month. Upgrade your plan to continue.`
    )
    
    // Add metadata to error for proper response handling
    ;(error as any).code = tokenUsage.reason || 'USAGE_LIMIT_EXCEEDED'
    ;(error as any).status = tokenUsage.reason === 'SUBSCRIPTION_EXPIRED' ? 402 : 429
    ;(error as any).metadata = {
      limitType: 'tokens',
      used: tokenUsage.used,
      limit: tokenUsage.limit,
      remaining: tokenUsage.remaining,
      upgradeUrl: '/subscription'
    }
    
    throw error
  }
}

/**
 * Subscription status validation middleware - checks if subscription is active
 */
export async function withSubscriptionCheck(userId: string): Promise<void> {
  const { getUserSubscription, isSubscriptionActive } = await import('../payments/subscription-utils')
  
  const subscription = await getUserSubscription(userId)
  
  if (!isSubscriptionActive(subscription)) {
    const error = new Error('Your subscription has expired. Please upgrade to continue.')
    ;(error as any).code = 'SUBSCRIPTION_EXPIRED'
    ;(error as any).status = 402
    ;(error as any).metadata = {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      upgradeUrl: '/subscription'
    }
    
    throw error
  }
}

/**
 * Client access validation middleware - checks if user owns the client
 */
export async function withClientAccess(userId: string, clientId: string): Promise<any> {
  const { prisma } = await import('../prisma')
  
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  })

  if (!client) {
    const error = new Error('Client not found')
    ;(error as any).status = 404
    throw error
  }

  return client
}


// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Track usage after successful API completion
 */
export async function trackUsage(
  userId: string,
  metadata?: {
    tokensUsed?: number
    model?: string
    [key: string]: any
  }
): Promise<void> {
  try {
    const { updateUsageTracking } = await import('../payments/subscription-utils')
    await updateUsageTracking(userId, metadata)
  } catch (error) {
    console.error('Error tracking usage:', error)
    // Don't throw error as this shouldn't break the main functionality
  }
}

/**
 * Get comprehensive usage information for client-side display
 */
export async function getUsageInfo(userId: string) {
  try {
    const { getUserSubscription, getCurrentMonthUsage, isSubscriptionActive } = await import('../payments/subscription-utils')
    const { prisma } = await import('../prisma')
    const { getStorageAnalytics } = await import('../storage-utils')
    
    // Get subscription and usage data once, then check all limits
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ]);
    
    // Pass subscription to getStorageAnalytics to avoid duplicate query
    const storageAnalytics = await getStorageAnalytics(userId, subscription);

    // Check client limits - count current clients with caching
    const { getCachedClientCount, cacheClientCount } = await import('../payments/subscription-cache')
    let clientCount = getCachedClientCount(userId)
    if (clientCount === null) {
      clientCount = await prisma.client.count({ where: { userId } })
      cacheClientCount(userId, clientCount)
    }
    
    const clientUsage = {
      allowed: subscription.maxClients === -1 || clientCount < subscription.maxClients,
      limit: subscription.maxClients === -1 ? 'unlimited' as const : subscription.maxClients,
      used: clientCount,
      remaining: subscription.maxClients === -1 ? undefined : Math.max(0, subscription.maxClients - clientCount)
    };

    // Check token limits - primary limit for OpenRouter usage
    const tokenUsage = {
      allowed: subscription.maxTokensPerMonth === -1 || usage.tokensUsed < subscription.maxTokensPerMonth,
      limit: subscription.maxTokensPerMonth === -1 ? 'unlimited' as const : subscription.maxTokensPerMonth,
      used: usage.tokensUsed,
      remaining: subscription.maxTokensPerMonth === -1 ? undefined : Math.max(0, subscription.maxTokensPerMonth - usage.tokensUsed)
    };

    // Storage usage information
    const storageUsage = {
      allowed: storageAnalytics.usage.totalBytes < storageAnalytics.limit,
      limit: storageAnalytics.limit,
      used: storageAnalytics.usage.totalBytes,
      usedFormatted: storageAnalytics.usedFormatted,
      limitFormatted: storageAnalytics.limitFormatted,
      remaining: Math.max(0, storageAnalytics.limit - storageAnalytics.usage.totalBytes),
      remainingFormatted: storageAnalytics.remainingFormatted,
      usagePercentage: storageAnalytics.usagePercentage
    };

    return {
      // Plan info
      plan: subscription.plan,
      tier: subscription.tier || 'basic',
      
      // Subscription status
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      isActive: isSubscriptionActive(subscription),
      
      // Client limits (flat structure for frontend compatibility)
      clientsUsed: clientUsage.used,
      clientsLimit: clientUsage.limit === 'unlimited' ? -1 : clientUsage.limit,
      
      // Token limits (flat structure for frontend compatibility)
      tokensUsed: tokenUsage.used,
      tokensLimit: tokenUsage.limit === 'unlimited' ? -1 : tokenUsage.limit,
      
      // Storage limits (flat structure for frontend compatibility)
      storageUsed: Math.round(storageUsage.used / (1024 * 1024)), // Convert to MB
      storageLimit: Math.round(storageUsage.limit / (1024 * 1024)), // Convert to MB
    }
  } catch (error) {
    console.error('Error getting usage info:', error)
    return null
  }
} 