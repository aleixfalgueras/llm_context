import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit } from './subscription-utils'
import { createUsageLimitResponse } from './ai-wrapper'
import { NextRequest, NextResponse } from 'next/server'
import { enforceUsageLimit } from './usage-middleware'

export interface ApiMiddlewareResult {
  success: boolean
  userId?: string
  response?: Response
}

// Action types that require usage checking
export type ActionType = 'document' | 'client'

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
  action: ActionType,
  metadata?: Record<string, any>
) {
  try {
    const { trackUsage } = await import('./usage-middleware')
    
    switch (action) {
      case 'document':
        await trackUsage(userId, 'document_generation', undefined, metadata)
        break
      // Note: Clients don't have usage tracking since we count actual client records
      case 'client':
        // No usage tracking needed - we count actual clients in database
        break
    }
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