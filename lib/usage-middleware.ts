import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkUsageLimit, updateUsageTracking, checkModelAccess, getUserSubscription, isSubscriptionActive } from './subscription-utils'
import { prisma } from './prisma'
import { getModelsByTier } from './models-config'
import { getStorageAnalytics } from './storage-utils'
import { ApiErrorCode } from '@/types/enums'

export interface UsageLimitResponse {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
  message?: string
}

// Middleware to check usage limits and model access before API actions
export async function withAuthAndUsageCheck(
  action: 'client',
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

      // Check subscription expiration for write operations
      const subscription = await getUserSubscription(userId)
      if (!isSubscriptionActive(subscription)) {
        return Response.json(
          {
            error: 'Your subscription has expired. Please upgrade to continue creating new content.',
            code: ApiErrorCode.SUBSCRIPTION_EXPIRED,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            upgradeUrl: '/subscription'
          },
          { status: 402 }
        )
      }

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId, action)
      if (!usageCheck.allowed) {
        return Response.json(
          {
            error: `You've reached your monthly ${usageCheck.limitType} limit of ${usageCheck.limit}. Upgrade your plan to continue.`,
            code: ApiErrorCode.USAGE_LIMIT_EXCEEDED,
            limitType: usageCheck.limitType,
            used: usageCheck.used,
            limit: usageCheck.limit,
            upgradeUrl: '/subscription'
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

      // Check subscription expiration for AI requests (write operations)
      const subscription = await getUserSubscription(userId)
      if (!isSubscriptionActive(subscription)) {
        return Response.json(
          {
            error: 'Your subscription has expired. Please upgrade to continue using AI features.',
            code: ApiErrorCode.SUBSCRIPTION_EXPIRED,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            upgradeUrl: '/subscription'
          },
          { status: 402 }
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
            code: ApiErrorCode.MODEL_ACCESS_DENIED,
            tier: modelAccess.tier,
            plan: modelAccess.plan,
            modelId,
            upgradeUrl: '/subscription'
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
  metadata?: {
    tokensUsed?: number
    model?: string
    [key: string]: any
  }
) {
  try {
    await updateUsageTracking(userId, metadata)
  } catch (error) {
    console.error('Error tracking usage:', error)
    // Don't throw error as this shouldn't break the main functionality
  }
}

// Helper to get usage information for client-side display
export async function getUsageInfo(userId: string) {
  try {
    // Get subscription and usage data once, then check all limits
    // This prevents the race condition of 4 parallel checkUsageLimit calls
    const { getUserSubscription, getCurrentMonthUsage } = await import('./subscription-utils');
    
    // Parallelize database calls for better performance
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ]);
    
    // Pass subscription to getStorageAnalytics to avoid duplicate query
    const storageAnalytics = await getStorageAnalytics(userId, subscription);

    // Plan details stored in subscription object



    // Check client limits - count current clients with caching
    const { getCachedClientCount, cacheClientCount } = await import('./subscription-cache')
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