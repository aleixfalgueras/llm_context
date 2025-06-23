import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit } from './subscription-utils'
import { createUsageLimitResponse } from './openai-wrapper'

export interface ApiMiddlewareResult {
  success: boolean
  userId?: string
  response?: Response
}

/**
 * Unified middleware for API authentication and usage enforcement
 */
export async function withAuthAndUsageCheck(
  action: 'conversation' | 'document' | 'prompt' | 'client'
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
 * Wrapper for API routes that need authentication and usage checking
 */
export function withUsageEnforcement(
  action: 'conversation' | 'document' | 'prompt' | 'client',
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