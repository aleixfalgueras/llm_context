import { prisma } from './prisma'
import { logger, withTiming } from './logger'
import { getTierFromPlan, isModelAvailableForTier } from './models-config'
import { SubscriptionPlan, SubscriptionStatus, SubscriptionPlanType, ModelTier } from '../types/subscription-types'

import { 
  getCachedSubscription, 
  cacheSubscription, 
  getCachedUsage, 
  cacheUsage,
  invalidateSubscriptionCache,
  invalidateUsageCache
} from './subscription-cache'

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    price: 10,
    currency: 'USD',
    maxClients: 3,
    maxTokensPerMonth: 100000,        // 100K tokens - very profitable with basic tier models
    // Pricing calculation: Claude 3 Haiku (most expensive basic) = $0.000875/1K tokens
    // Max cost: 100K * $0.000875 = $0.875, leaving $9.12 profit (91% margin)
    description: 'Perfect for getting started with AI marketing assistance',
    features_list: [
      '👥 3 client profiles',
      '💾 50 MB document storage',
      '🔤 100K tokens (~75 pages of content)',
      '🤖 Cost-effective models: GPT-4o Mini, Claude Haiku, Gemini Flash'
    ]
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 25,
    currency: 'USD',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 2000000,       // 2M tokens - sustainable with premium models
    // Pricing calculation: Claude 3.5 Sonnet (most expensive pro) = $0.009/1K tokens
    // Max cost: 2000K * $0.009 = $18.00, leaving $7.00 profit (28% margin)
    description: 'For marketing professionals scaling their business',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 200 MB document storage',
      '🔤 2M tokens (~1,500 pages of content)',
      '🤖 Premium models: GPT-4o, Claude Sonnet, Gemini Pro + all basic models'
    ]
  },
  [SubscriptionPlan.BUSINESS]: {
    id: SubscriptionPlan.BUSINESS,
    name: 'Business',
    price: 50,
    currency: 'USD',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 4000000,       // 4M tokens - generous allowance for enterprise
    // Pricing calculation: Claude 3.5 Sonnet = $0.009/1K tokens
    // Max cost: 4000K * $0.009 = $36.00, leaving $14.00 profit (28% margin)
    description: 'For agencies and teams with advanced needs',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 2 GB document storage',
      '🔤 4M tokens (~3,000 pages of content)',
      '🤖 Premium models: GPT-4o, Claude Sonnet, Gemini Pro + all basic models'
    ]
  }
} as const

export type PlanId = SubscriptionPlan

// Get or create user subscription
export async function getUserSubscription(userId: string) {
  const endTiming = logger.startTiming('Get User Subscription', { userId });
  
  try {
    // Check cache first
    const cached = getCachedSubscription(userId)
    if (cached) {
      logger.debug('Returning cached subscription', { userId })
      endTiming();
      return cached
    }

    logger.dbQuery('findUnique', 'userSubscription', { userId });
    
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId }
    })

    // Create default basic subscription if none exists using upsert to prevent race conditions
    if (!subscription) {
      logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.BASIC } });
      
      const now = new Date()
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      logger.dbQuery('upsert', 'userSubscription', { userId });
      subscription = await withTiming(
        'Create user subscription',
        () => prisma.userSubscription.upsert({
          where: { userId },
          update: {}, // Don't update if exists
          create: {
            userId,
            plan: SubscriptionPlan.BASIC,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            maxClients: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxClients,
            maxTokensPerMonth: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxTokensPerMonth,
          }
        }),
        { userId },
        500 // Database operations should be fast - warn if >500ms
      );
    }

    // Cache the result
    cacheSubscription(userId, subscription)

    endTiming();
    return subscription
  } catch (error) {
    logger.error('Error getting user subscription', error as Error, { userId });
    endTiming();
    throw error
  }
}

// Get current month usage
export async function getCurrentMonthUsage(userId: string) {
  const endTiming = logger.startTiming('Get Current Month Usage', { userId });
  
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    // Check cache first (shorter TTL for usage data)
    const cacheKey = `${userId}_${year}_${month}`
    const cached = getCachedUsage(cacheKey)
    if (cached) {
      logger.debug('Returning cached usage', { userId, metadata: { year: year.toString(), month: month.toString() } })
      endTiming();
      return cached
    }

    logger.dbQuery('findUnique', 'userUsage', { userId });
    let usage = await prisma.userUsage.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month
        }
      }
    })

    // Create usage record if none exists for current month using upsert to prevent race conditions
    if (!usage) {
      logger.info('Creating new user usage record', { 
        userId,
        metadata: { year, month }
      });
      
      logger.dbQuery('upsert', 'userUsage', { userId });
      usage = await withTiming(
        'Create user usage record',
        () => prisma.userUsage.upsert({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          },
          update: {}, // Don't update if exists
                  create: {
          userId,
          year,
          month,
          tokensUsed: 0,
        }
        }),
        { userId },
        500 // Database operations should be fast - warn if >500ms
      );
    }

    // Cache the result
    cacheUsage(cacheKey, usage)

    endTiming();
    return usage
  } catch (error) {
    logger.error('Error getting current month usage', error as Error, { 
      userId,
      metadata: { year: year.toString(), month: month.toString() }
    });
    endTiming();
    throw error
  }
}

// Check usage limits for different actions
export async function checkUsageLimit(userId: string, action: 'client') {
  const endTiming = logger.startTiming('Check Usage Limit', { userId });
  
  try {
    const subscription = await getUserSubscription(userId)

    switch (action) {
      case 'client':
        const clientCount = await prisma.client.count({ where: { userId } })
        const maxClients = subscription.maxClients
        if (maxClients === -1) return { allowed: true, limit: 'unlimited', used: clientCount, limitType: 'clients' }
        return {
          allowed: clientCount < maxClients,
          limit: maxClients,
          used: clientCount,
          remaining: maxClients - clientCount,
          limitType: 'clients'
        }

      default:
        logger.warn('Unknown action type for usage limit check', { 
          userId,
          metadata: { action }
        });
        endTiming();
        return { allowed: false, limit: 0, used: 0 }
    }
  } catch (error) {
    logger.error('Error checking usage limit', error as Error, { 
      userId,
      metadata: { action }
    });
    endTiming();
    return { allowed: false, limit: 0, used: 0 }
  } finally {
    endTiming();
  }
}

// Track usage by updating monthly usage only (no individual events)
export async function updateUsageTracking(
  userId: string,
  metadata?: {
    tokensUsed?: number
    // Removed estimatedCost - OpenRouter handles billing automatically
    [key: string]: any
  }
) {
  const endTiming = logger.startTiming('Update Usage Tracking', { userId });
  
  try {
    // Update monthly usage directly
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const updateData: any = {}
    
    if (metadata?.tokensUsed) {
      updateData.tokensUsed = { increment: metadata.tokensUsed }
    }
    // Removed estimatedCost increment - OpenRouter handles billing automatically

    await prisma.userUsage.upsert({
      where: {
        userId_year_month: {
          userId,
          year,
          month
        }
      },
      create: {
        userId,
        year,
        month,
        tokensUsed: metadata?.tokensUsed || 0,
        // Removed estimatedCost - OpenRouter handles billing automatically
      },
      update: updateData
    })

    // Invalidate usage cache after update
    const cacheKey = `${userId}_${year}_${month}`
    invalidateUsageCache(cacheKey)

    endTiming();
  } catch (error) {
    logger.error('Error updating usage tracking', error as Error, { 
      userId
    });
    endTiming();
    throw error
  }
}

// Check if user can access a specific model based on their subscription
export async function checkModelAccess(userId: string, modelId: string) {
  const endTiming = logger.startTiming('Check Model Access', { userId });
  
  try {
    const subscription = await getUserSubscription(userId)
    const tier = getTierFromPlan(subscription.plan)
    const hasAccess = isModelAvailableForTier(modelId, tier)
    
    endTiming();
    return {
      allowed: hasAccess,
      tier,
      plan: subscription.plan,
      modelId
    }
  } catch (error) {
    logger.error('Error checking model access', error as Error, { 
      userId,
      metadata: { modelId }
    });
    endTiming();
    return { allowed: false, tier: ModelTier.BASIC, plan: SubscriptionPlan.BASIC, modelId }
  }
}

// Note: OpenRouter handles billing automatically based on actual usage
// The cost tracking in this app is for display/limit purposes only

// Get usage analytics for dashboard
export async function getUserUsageAnalytics(userId: string) {
  try {
    const [subscription, currentUsage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ])

    const plan = SUBSCRIPTION_PLANS[subscription.plan as PlanId]

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      limits: {
        clients: subscription.maxClients,
        tokens: subscription.maxTokensPerMonth,
        // Removed cost limit - OpenRouter handles billing automatically
      },
      usage: {
        tokensUsed: currentUsage.tokensUsed,
      },
      planDetails: plan
    }
  } catch (error) {
    console.error('Error getting usage analytics:', error)
    throw error
  }
} 