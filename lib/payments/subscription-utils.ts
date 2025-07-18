import { prisma } from '../prisma'
import { logger, withTiming } from '../logger'
import { getTierFromPlan, isModelAvailableForTier } from '../ai/models-config'
import { SubscriptionPlan, SubscriptionStatus, ModelTier } from '@/types/subscription-types'
import { ApiSubscriptionErrorCode } from '@/types/enums'

// Plan hierarchy for upgrade/downgrade detection
const PLAN_HIERARCHY = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.BUSINESS]

import { 
  getCachedSubscription, 
  cacheSubscription, 
  getCachedUsage, 
  cacheUsage,
  invalidateUsageCache,
  invalidateAllUserCaches
} from './subscription-cache'

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    price: 10,
    currency: 'EUR',
    maxClients: 3,
    maxTokensPerMonth: 5000000,        // 5M tokens - generous allowance with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 5M * $0.000175 = $0.875, leaving $10.845 profit (92.5% margin) [€10 = $11.72]
    description: 'Perfect for getting started',
    features_list: [
      '👥 3 client profiles',
      '💾 50 MB document storage',
      '🔤 5M tokens (~3,750 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 25,
    currency: 'EUR',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 15000000,       // 15M tokens - excellent value with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 15M * $0.000175 = $2.625, leaving $26.675 profit (91.0% margin) [€25 = $29.30]
    description: 'For marketing professionals scaling their business',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 200 MB document storage',
      '🔤 15M tokens (~11,250 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.BUSINESS]: {
    id: SubscriptionPlan.BUSINESS,
    name: 'Business',
    price: 50,
    currency: 'EUR',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 40000000,       // 40M tokens - enterprise-level allowance
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 40M * $0.000175 = $7, leaving $51.60 profit (88.1% margin) [€50 = $58.60]
    description: 'For agencies and teams with advanced needs',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 2 GB document storage',
      '🔤 40M tokens (~30,000 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  }
} as const

export type PlanId = SubscriptionPlan

// Plan name color utilities
export function getPlanNameColor(planId: string) {
  switch (planId) {
    case SubscriptionPlan.BASIC: return 'text-green-600 dark:text-green-400'
    case SubscriptionPlan.PRO: return 'text-blue-600 dark:text-blue-400'
    case SubscriptionPlan.BUSINESS: return 'text-purple-600 dark:text-purple-400'
    default: return 'text-green-600 dark:text-green-400'
  }
}

// Get or create user subscription
export async function getUserSubscription(userId: string, bypassCache = false) {
  const endTiming = logger.startTiming('Get User Subscription', { userId });
  
  try {
    // Check cache first (unless bypassing cache)
    if (!bypassCache) {
      const cached = await getCachedSubscription(userId)
      if (cached) {
        logger.info('Returning cached subscription', { userId })
        endTiming();
        return cached
      }
    } else {
      logger.info('Bypassing cache for subscription fetch', { userId })
    }

    logger.dbQuery('findUnique', 'userSubscription', { userId });
    
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId }
    })

    // Create default basic subscription if none exists using upsert to prevent race conditions
    if (!subscription) {
      logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.BASIC } });
      
      const now = new Date()
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      
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
            cancelAtPeriodEnd: false,
            pendingPlanChange: null,
          }
        }),
        { userId },
        500 // Database operations should be fast - warn if >500ms
      );
    }

    // Cache the result
    await cacheSubscription(userId, subscription)

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
    const cached = await getCachedUsage(cacheKey)
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
    await cacheUsage(cacheKey, usage)

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

// Check token usage limits before AI requests
export async function checkTokenUsageLimit(userId: string) {
  const endTiming = logger.startTiming('Check Token Usage Limit', { userId });
  
  try {
    const subscription = await getUserSubscription(userId)
    
    // Check if subscription is active first
    if (!isSubscriptionActive(subscription)) {
      logger.warn('Subscription is not active for token usage limit check', { 
        userId,
        metadata: { 
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
      endTiming();
      return { 
        allowed: false, 
        limit: 0, 
        used: 0, 
        limitType: 'tokens',
        reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED 
      }
    }

    const usage = await getCurrentMonthUsage(userId)
    const maxTokens = subscription.maxTokensPerMonth
    
    if (maxTokens === -1) {
      endTiming();
      return { 
        allowed: true, 
        limit: 'unlimited', 
        used: usage.tokensUsed, 
        limitType: 'tokens' 
      }
    }
    
    endTiming();
    return {
      allowed: usage.tokensUsed < maxTokens,
      limit: maxTokens,
      used: usage.tokensUsed,
      remaining: maxTokens - usage.tokensUsed,
      limitType: 'tokens'
    }
  } catch (error) {
    logger.error('Error checking token usage limit', error as Error, { userId });
    endTiming();
    return { allowed: false, limit: 0, used: 0, limitType: 'tokens' }
  }
}

// Check usage limits for different actions
export async function checkUsageLimit(userId: string, action: 'client') {
  const endTiming = logger.startTiming('Check Usage Limit', { userId });
  
  try {
    const subscription = await getUserSubscription(userId)

    // Check if subscription is active first
    if (!isSubscriptionActive(subscription)) {
      logger.warn('Subscription is not active for usage limit check', { 
        userId,
        metadata: { 
          action,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
      endTiming();
      return { 
        allowed: false, 
        limit: 0, 
        used: 0, 
        limitType: action,
        reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED 
      }
    }

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

    const result = await prisma.userUsage.upsert({
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

    logger.info('Updated tokensUsed', { 
      userId, 
      tokensUsed: result.tokensUsed 
    });

    // Invalidate usage cache after update
    const cacheKey = `${userId}_${year}_${month}`
    await invalidateUsageCache(cacheKey)

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
    
    // Check if subscription is active first
    if (!isSubscriptionActive(subscription)) {
      logger.warn('Subscription is not active for model access check', { 
        userId,
        metadata: { 
          modelId,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
      endTiming();
      return { 
        allowed: false, 
        tier: ModelTier.BASIC, 
        plan: subscription.plan, 
        modelId,
        reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED 
      }
    }

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

// Check if subscription is active and not expired
export function isSubscriptionActive(subscription: any) {
  if (!subscription) return false
  
  const now = new Date()
  const isStatusActive = subscription.status === SubscriptionStatus.ACTIVE
  const isNotExpired = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
  
  return isStatusActive && isNotExpired
}

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
        isActive: isSubscriptionActive(subscription),
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

/**
 * Determine if a plan change is an upgrade or downgrade
 */
export function isUpgrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan)
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan)
  return targetIndex > currentIndex
}

/**
 * Determine if a plan change is a downgrade
 */
export function isDowngrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan)
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan)
  return targetIndex < currentIndex
}

/**
 * Cancel an existing Stripe subscription schedule
 */
export async function cancelExistingSchedule(scheduleId: string): Promise<void> {
  const { stripe } = await import('./stripe')
  
  try {
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
    
    // Only cancel if schedule is still active
    if (schedule.status === 'active') {
      await stripe.subscriptionSchedules.cancel(scheduleId)
      
      logger.info('Successfully canceled existing subscription schedule', {
        metadata: {
          scheduleId,
          previousStatus: schedule.status,
          userId: schedule.metadata?.userId
        }
      })
    } else {
      logger.info('Schedule already inactive, skipping cancellation', {
        metadata: {
          scheduleId,
          status: schedule.status,
          userId: schedule.metadata?.userId
        }
      })
    }
  } catch (error) {
    logger.error('Failed to cancel existing subscription schedule', error as Error, {
      metadata: { scheduleId }
    })
    throw error
  }
}

/**
 * Helper function to clean up schedule and database fields
 */
async function cleanupScheduleAndDatabase(scheduleId: string, userId: string): Promise<void> {
  try {
    // Cancel the existing schedule
    await cancelExistingSchedule(scheduleId)
    
    // Clear the schedule ID and pending plan change from database
    await prisma.userSubscription.update({
      where: { userId },
      data: { 
        stripeScheduleId: null,
        pendingPlanChange: null
      }
    })
    
    logger.info('Successfully cleaned up schedule and database', {
      userId,
      metadata: {
        clearedScheduleId: scheduleId
      }
    })
  } catch (error) {
    logger.error('Failed to cleanup schedule and database', error as Error, {
      userId,
      metadata: {
        scheduleId
      }
    })
    throw error
  }
}

/**
 * Get active subscription schedule for a user
 */
export async function getActiveSchedule(userId: string): Promise<string | null> {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      select: { stripeScheduleId: true }
    })
    
    if (!subscription?.stripeScheduleId) {
      return null
    }
    
    // Verify schedule is still active in Stripe
    const { stripe } = await import('./stripe')
    const schedule = await stripe.subscriptionSchedules.retrieve(subscription.stripeScheduleId)
    
    if (schedule.status === 'active') {
      return subscription.stripeScheduleId
    } else {
      // Schedule is no longer active, clean up database
      await prisma.userSubscription.update({
        where: { userId },
        data: { stripeScheduleId: null }
      })
      
      logger.info('Cleaned up inactive schedule ID from database', {
        userId,
        metadata: {
          scheduleId: subscription.stripeScheduleId,
          status: schedule.status
        }
      })
      
      return null
    }
  } catch (error) {
    logger.error('Failed to get active schedule', error as Error, { userId })
    return null
  }
}

/**
 * Schedule a subscription downgrade to take effect at the end of the current billing period
 */
export async function scheduleSubscriptionDowngrade(
  stripeSubscriptionId: string,
  targetPriceId: string,
  userId: string,
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): Promise<{
  effectiveDate: Date
  message: string
}> {
  // Import stripe here to avoid circular dependency
  const { stripe } = await import('./stripe')
  
  logger.info('Starting downgrade scheduling process', {
    userId,
    metadata: {
      currentPlan,
      targetPlan,
      subscriptionId: stripeSubscriptionId
    }
  })

  
  // Check for existing schedule and clean up if necessary
  const existingScheduleId = await getActiveSchedule(userId)
  if (existingScheduleId) {
    logger.info('Found existing schedule, cleaning up before creating new one', {
      userId,
      metadata: {
        existingScheduleId,
        subscriptionId: stripeSubscriptionId,
        currentPlan,
        targetPlan
      }
    })
    
    try {
      await cleanupScheduleAndDatabase(existingScheduleId, userId)
    } catch (cleanupError) {
      logger.error('Failed to clean up existing schedule, proceeding anyway', cleanupError as Error, {
        userId,
        metadata: {
          existingScheduleId,
          subscriptionId: stripeSubscriptionId
        }
      })
    }
  }

  // Get current subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
  
  // Get the effective date (current period end from subscription item)
  const subscriptionItem = stripeSubscription.items.data[0]
  const currentPeriodEnd = subscriptionItem.current_period_end
  const effectiveDate = new Date(currentPeriodEnd * 1000)

  // Create subscription schedule from existing subscription (Step 1)
  let schedule: any
  try {
    schedule = await stripe.subscriptionSchedules.create({
      from_subscription: stripeSubscriptionId,
    })
    
    logger.info('Created subscription schedule from existing subscription', {
      userId,
      metadata: {
        scheduleId: schedule.id,
        subscriptionId: stripeSubscriptionId,
        currentPlan,
        targetPlan,
        effectiveDate: effectiveDate.toISOString()
      }
    })
  } catch (error) {
    const errorMessage = (error as Error).message
    
    // Check if this is the specific "already attached to a schedule" error
    if (errorMessage.includes('already attached to a schedule')) {
      logger.warn('Detected subscription already attached to schedule, attempting automatic cleanup and retry', {
        userId,
        metadata: {
          subscriptionId: stripeSubscriptionId,
          errorMessage,
          currentPlan,
          targetPlan
        }
      })
      
      try {
        // Try to find and clean up any remaining schedule association
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        
        if (subscription.schedule) {
          logger.info('Found schedule association on subscription, cleaning up', {
            userId,
            metadata: {
              subscriptionId: stripeSubscriptionId,
              scheduleId: subscription.schedule
            }
          })
          
          // Try to cancel the associated schedule and clean up database
          await cleanupScheduleAndDatabase(subscription.schedule as string, userId)
          
          // Retry creating the schedule
          schedule = await stripe.subscriptionSchedules.create({
            from_subscription: stripeSubscriptionId,
          })
          
          logger.info('Successfully created schedule after cleanup and retry', {
            userId,
            metadata: {
              scheduleId: schedule.id,
              subscriptionId: stripeSubscriptionId,
              currentPlan,
              targetPlan
            }
          })
        } else {
          throw new Error('No schedule found on subscription but still getting schedule error')
        }
      } catch (retryError) {
        logger.error('Failed to automatically resolve schedule conflict', retryError as Error, {
          userId,
          metadata: {
            subscriptionId: stripeSubscriptionId,
            originalError: errorMessage
          }
        })
        throw new Error(`Cannot create downgrade schedule: subscription already has an attached schedule. Please contact support or try canceling any existing downgrades first.`)
      }
    } else {
      logger.error('Failed to create subscription schedule from existing subscription', error as Error, {
        userId,
        metadata: {
          subscriptionId: stripeSubscriptionId,
          currentPlan,
          targetPlan,
          effectiveDate: effectiveDate.toISOString()
        }
      })
      throw error
    }
  }

  // Update subscription schedule with downgrade phase (Step 2)
  try {
    await stripe.subscriptionSchedules.update(schedule.id, {
      metadata: {
        userId,
        currentPlan,
        targetPlan,
        downgradedAt: new Date().toISOString(),
      },
      phases: [
        // Keep the current phase as-is (this represents the existing subscription)
        {
          items: schedule.phases[0].items, // Use existing items from current phase
          start_date: schedule.phases[0].start_date, // Keep original start date
          end_date: currentPeriodEnd, // End current phase at billing period end
        },
        // Add new phase for the downgraded plan
        {
          items: [{ price: targetPriceId, quantity: 1 }],
          start_date: currentPeriodEnd, // Start new phase when current period ends

        }
      ]
    })
    
    logger.info('Updated subscription schedule with downgrade phase', {
      userId,
      metadata: {
        scheduleId: schedule.id,
        subscriptionId: stripeSubscriptionId,
        currentPlan,
        targetPlan,
        effectiveDate: effectiveDate.toISOString(),
        startDate: currentPeriodEnd
      }
    })
  } catch (error) {
    logger.error('Failed to update subscription schedule with downgrade phase', error as Error, {
      userId,
      metadata: {
        scheduleId: schedule.id,
        subscriptionId: stripeSubscriptionId,
        currentPlan,
        targetPlan,
        effectiveDate: effectiveDate.toISOString()
      }
    })
    throw error
  }

  // Update database with pending plan change and schedule ID
  await prisma.userSubscription.update({
    where: { userId },
    data: { 
      pendingPlanChange: targetPlan,
      stripeScheduleId: schedule.id
    }
  })

  logger.info('Downgrade scheduled successfully', {
    userId,
    metadata: {
      currentPlan,
      targetPlan,
      subscriptionId: stripeSubscriptionId,
      scheduleId: schedule.id,
      effectiveDate: effectiveDate.toISOString(),
      pendingPlanChange: targetPlan
    }
  })

  // Invalidate caches after scheduling downgrade
  await invalidateAllUserCaches(userId)

  return {
    effectiveDate,
    message: `Downgrade scheduled successfully. Your plan will change to ${targetPlan} on ${effectiveDate.toLocaleDateString()}.`
  }
} 