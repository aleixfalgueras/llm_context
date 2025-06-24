import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit, updateUsageTracking } from './subscription-utils'
import { createUsageLimitResponse } from './openai-wrapper'
import { prisma } from './prisma'

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
    await updateUsageTracking(userId, eventType, metadata)
  } catch (error) {
    console.error('Error tracking usage:', error)
    // Don't throw error as this shouldn't break the main functionality
  }
}

// Document usage checking functions moved to lib/document-usage-utils.ts for better organization

// Helper to get usage information for client-side display
export async function getUsageInfo(userId: string) {
  try {
    // Get subscription and usage data once, then check all limits
    // This prevents the race condition of 4 parallel checkUsageLimit calls
    const { getUserSubscription, getCurrentMonthUsage, SUBSCRIPTION_PLANS } = await import('./subscription-utils');
    
    // Parallelize all database calls for better performance
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ]);

    const plan = SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS];

    // Check conversation limits
    const conversationUsage = {
      allowed: subscription.maxConversationsPerMonth === -1 || usage.conversationsUsed < subscription.maxConversationsPerMonth,
      limit: subscription.maxConversationsPerMonth === -1 ? 'unlimited' as const : subscription.maxConversationsPerMonth,
      used: usage.conversationsUsed,
      remaining: subscription.maxConversationsPerMonth === -1 ? undefined : Math.max(0, subscription.maxConversationsPerMonth - usage.conversationsUsed)
    };

    // Check document limits - use usage events to prevent bypassing limits by deleting documents
    const documentUsage = {
      allowed: subscription.maxDocumentsPerMonth === -1 || usage.documentsGenerated < subscription.maxDocumentsPerMonth,
      limit: subscription.maxDocumentsPerMonth === -1 ? 'unlimited' as const : subscription.maxDocumentsPerMonth,
      used: usage.documentsGenerated,
      remaining: subscription.maxDocumentsPerMonth === -1 ? undefined : Math.max(0, subscription.maxDocumentsPerMonth - usage.documentsGenerated)
    };

    // Check client limits - count current clients instead of creation events
    const clientCount = await prisma.client.count({ where: { userId } })
    const clientUsage = {
      allowed: subscription.maxClients === -1 || clientCount < subscription.maxClients,
      limit: subscription.maxClients === -1 ? 'unlimited' as const : subscription.maxClients,
      used: clientCount,
      remaining: subscription.maxClients === -1 ? undefined : Math.max(0, subscription.maxClients - clientCount)
    };

    // Check prompt limits 
    const promptUsage = {
      allowed: subscription.maxPromptsPerUser === -1 || usage.promptsUsed < subscription.maxPromptsPerUser,
      limit: subscription.maxPromptsPerUser === -1 ? 'unlimited' as const : subscription.maxPromptsPerUser,
      used: usage.promptsUsed,
      remaining: subscription.maxPromptsPerUser === -1 ? undefined : Math.max(0, subscription.maxPromptsPerUser - usage.promptsUsed)
    };

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