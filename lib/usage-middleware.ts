import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit, updateUsageTracking, checkModelAccess } from './subscription-utils'
import { createUsageLimitResponse } from './ai-wrapper'
import { prisma } from './prisma'
import { getModelsByTier, getTierFromPlan } from './models-config'

export interface UsageLimitResponse {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
  message?: string
}

// Middleware to check usage limits and model access before API actions
export async function withAuthAndUsageCheck(
  action: 'document' | 'client',
  handler: (userId: string, req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      // Check authentication
      const { userId } = await auth()
      
      if (!userId) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId, action)
      if (!usageCheck.allowed) {
        return Response.json(
          {
            error: `You've reached your monthly ${usageCheck.limitType} limit of ${usageCheck.limit}. Upgrade your plan to continue.`,
            code: 'USAGE_LIMIT_EXCEEDED',
            limitType: usageCheck.limitType,
            used: usageCheck.used,
            limit: usageCheck.limit,
            upgradeUrl: '/pricing'
          },
          { status: 429 }
        )
      }

      // Execute the handler
      return await handler(userId, req)
    } catch (error) {
      console.error('Error in usage middleware:', error)
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Middleware specifically for model validation (for AI requests)
export async function withModelAccessCheck(
  modelId: string,
  handler: (userId: string, req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      // Check authentication
      const { userId } = await auth()
      
      if (!userId) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check model access
      const modelAccess = await checkModelAccess(userId, modelId)
      if (!modelAccess.allowed) {
        const availableModels = getModelsByTier(modelAccess.tier)
        const modelNames = availableModels.map(m => m.name).join(', ')
        
        return Response.json(
          {
            error: `Your ${modelAccess.plan} plan doesn't include access to this model. Available models: ${modelNames}`,
            code: 'MODEL_ACCESS_DENIED',
            tier: modelAccess.tier,
            plan: modelAccess.plan,
            modelId,
            upgradeUrl: '/pricing'
          },
          { status: 403 }
        )
      }

      // Execute the handler
      return await handler(userId, req)
    } catch (error) {
      console.error('Error in model access middleware:', error)
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Helper to track usage after successful API action
export async function trackUsage(
  userId: string,
  eventType: 'document_generation',
  resourceId?: string,
  metadata?: {
    tokensUsed?: number
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

    // Documents are unlimited for all plans - no need to check limits
    const documentUsage = {
      allowed: true,
      limit: 'unlimited' as const,
      used: usage.documentsGenerated,
      remaining: undefined
    };

    // Check client limits - count current clients instead of creation events
    const clientCount = await prisma.client.count({ where: { userId } })
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

    return {
      documents: documentUsage,
      clients: clientUsage,
      tokens: tokenUsage,
    }
  } catch (error) {
    console.error('Error getting usage info:', error)
    return null
  }
} 