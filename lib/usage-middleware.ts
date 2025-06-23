import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit, trackUsageEvent } from './subscription-utils'
import { createUsageLimitResponse } from './openai-wrapper'

export interface UsageLimitResponse {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
  message?: string
}

// Middleware to check usage limits before API actions
export async function enforceUsageLimit(
  request: NextRequest,
  action: 'conversation' | 'document' | 'prompt' | 'client'
): Promise<{ allowed: boolean; response?: NextResponse; userId?: string }> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }
    }

    const usageCheck = await checkUsageLimit(userId, action)
    
    if (!usageCheck.allowed) {
      // Use the enhanced createUsageLimitResponse for consistent, detailed error messages
      const response = createUsageLimitResponse(
        action, 
        usageCheck.limit as number | "unlimited",
        (usageCheck as any).limitType,
        (usageCheck as any).used
      )
      
      return {
        allowed: false,
        response: new NextResponse(response.body, {
          status: response.status,
          headers: response.headers
        })
      }
    }

    return { allowed: true, userId }
  } catch (error) {
    console.error('Error in usage limit enforcement:', error)
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}

// Helper to track usage after successful API action
export async function trackUsage(
  userId: string,
  eventType: 'conversation' | 'document_generation' | 'prompt_usage',
  resourceId?: string,
  metadata?: {
    tokensUsed?: number
    estimatedCost?: number
    model?: string
    [key: string]: any
  }
) {
  try {
    await trackUsageEvent(userId, eventType, resourceId, metadata)
  } catch (error) {
    console.error('Error tracking usage:', error)
    // Don't throw error as this shouldn't break the main functionality
  }
}

// Helper to get usage information for client-side display
export async function getUsageInfo(userId: string) {
  try {
    const [conversationUsage, documentUsage, clientUsage, promptUsage] = await Promise.all([
      checkUsageLimit(userId, 'conversation'),
      checkUsageLimit(userId, 'document'),
      checkUsageLimit(userId, 'client'),
      checkUsageLimit(userId, 'prompt')
    ])

    return {
      conversations: conversationUsage,
      documents: documentUsage,
      clients: clientUsage,
      prompts: promptUsage
    }
  } catch (error) {
    console.error('Error getting usage info:', error)
    return null
  }
} 