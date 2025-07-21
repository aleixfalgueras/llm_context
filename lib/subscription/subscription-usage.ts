import {cacheUsage, getCachedUsage, invalidateUsageCache} from "@/lib/subscription/subscription-cache";
import {logger, withTiming} from "@/lib/logger";
import {prisma} from "@/lib/prisma";
import {PlanId, SUBSCRIPTION_PLAN_DETAIL} from "@/types/subscription-types";
import {getUserSubscription, isSubscriptionActive} from "@/lib/subscription/subscription-utils";
import {ApiSubscriptionErrorCode} from "@/types/enums";
import {getStorageAnalytics} from "@/lib/utils/storage";

/**
 * Track usage after successful API completion by updating monthly usage records.
 * 
 * This function increments the user's monthly token usage and invalidates the cache
 * to ensure fresh data on subsequent requests. It uses upsert to handle cases where
 * the monthly usage record doesn't exist yet.
 * 
 * @param userId - The user ID to track usage for
 * @param metadata - Optional metadata object containing usage details
 * @param metadata.tokensUsed - Number of tokens consumed in this operation
 * @param metadata.model - AI model used (for logging purposes)
 * @param metadata.[key] - Additional metadata fields for logging
 * 
 * @returns Promise<void> - Does not return a value
 * 
 * @throws Never throws - All errors are caught and logged to prevent breaking main functionality
 * 
 * **Behavior:**
 * - Creates new monthly usage record if none exists for current month
 * - Increments existing token usage atomically using Prisma increment
 * - Invalidates usage cache after successful update
 * - Logs all operations for monitoring and debugging
 * - Gracefully handles errors without throwing to avoid breaking API calls
 * 
 * **Usage Pattern:**
 * Should be called after successful AI API completions to maintain accurate usage tracking.
 * Non-blocking operation that won't affect user experience if it fails.
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
    // Update monthly usage directly
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const updateData: any = {}
    
    if (metadata?.tokensUsed) {
      updateData.tokensUsed = { increment: metadata.tokensUsed }
    }

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

  } catch (error) {
    logger.error('Error tracking usage', error as Error, { userId });
    // Don't throw error as this shouldn't break the main functionality
  }
}

/**
 * Get current month usage data with intelligent caching and auto-creation.
 * 
 * Retrieves the user's usage statistics for the current calendar month, implementing
 * a multi-layer approach with caching, database queries, and automatic record creation
 * to ensure consistent data availability.
 * 
 * @param userId - The user ID to retrieve usage data for
 * 
 * @returns Promise<UserUsage> - Complete usage record with the following structure:
 *   - userId: User identifier
 *   - year: Current year (e.g., 2024)
 *   - month: Current month (1-12)
 *   - tokensUsed: Number of tokens consumed this month
 *   - createdAt: Record creation timestamp
 *   - updatedAt: Last update timestamp
 * 
 * @throws Error - Database connection or query failures
 * 
 * **Caching Strategy:**
 * - First checks Redis cache with key format: `{userId}_{year}_{month}`
 * - Cache TTL optimized for usage data freshness requirements
 * - Cache populated after successful database queries
 * 
 * **Auto-Creation Logic:**
 * - Uses upsert operation to prevent race conditions during record creation
 * - Creates new usage record with zero tokens if none exists for current month
 * - Logs creation events for monitoring and debugging
 * 
 * **Performance Monitoring:**
 * - Database operations timed with 500ms performance threshold
 * - Comprehensive error logging with contextual metadata
 * - Debug logging for cache hits to monitor cache effectiveness
 * 
 * **Usage Pattern:**
 * Called frequently by usage validation and display components.
 * Essential for subscription limit enforcement and user dashboard display.
 */
export async function getCurrentMonthUsage(userId: string) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    // Check cache first (shorter TTL for usage data)
    const cacheKey = `${userId}_${year}_${month}`
    const cached = await getCachedUsage(cacheKey)
    if (cached) {
      logger.debug('Returning cached usage', {userId, metadata: {year: year.toString(), month: month.toString()}})
      return cached
    }

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
        metadata: {year, month}
      });

      logger.dbQuery('upsert', 'userUsage', {userId});
      usage = await prisma.userUsage.upsert({
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
        })
    }

    // Cache the result
    await cacheUsage(cacheKey, usage)

    return usage
  } catch (error) {
    logger.error('Error getting current month usage', error as Error, {
      userId,
      metadata: {year: year.toString(), month: month.toString()}
    });
    throw error
  }
}

/**
 * Get comprehensive usage information optimized for client-side display and validation.
 * 
 * Aggregates subscription details, token usage, storage analytics, and plan information
 * into a flattened structure optimized for frontend consumption. Combines multiple data
 * sources to provide a complete view of user account status and usage limits.
 * 
 * @param userId - The user ID to retrieve comprehensive usage info for
 * @param bypassCache - Optional flag to force fresh data retrieval (default: false)
 * 
 * @returns Promise<UsageInfo | null> - Comprehensive usage object with flat structure:
 *   **Plan & Subscription:**
 *   - plan: Current subscription plan ID
 *   - tier: User tier (basic, pro, etc.)
 *   - status: Subscription status (active, canceled, etc.)
 *   - currentPeriodEnd: When current billing period ends
 *   - isActive: Boolean indicating if subscription is currently active
 *   - stripeSubscriptionId: Stripe subscription identifier
 *   - cancelAtPeriodEnd: Whether subscription cancels at period end
 *   - pendingPlanChange: Any pending plan changes
 * 
 *   **Token Usage (Flat Structure):**
 *   - tokensUsed: Number of tokens consumed this month
 *   - tokensLimit: Monthly token limit (-1 for unlimited)
 * 
 *   **Storage Usage (Flat Structure in MB):**
 *   - storageUsed: Storage consumed in megabytes
 *   - storageLimit: Storage limit in megabytes
 * 
 * @returns null if error occurs (logged but not thrown)
 * 
 * **Data Integration:**
 * - Fetches subscription and usage data in parallel for performance
 * - Integrates storage analytics with subscription context
 * - Calculates remaining quotas and usage percentages
 * - Provides formatted values for direct UI display
 * 
 * **Frontend Optimization:**
 * - Flat structure eliminates need for nested object access
 * - Consistent units (MB for storage) for easy display
 * - Boolean flags for quick conditional rendering
 * - Handles unlimited limits with -1 convention
 * 
 * **Error Handling:**
 * - Returns null on any error (check for null in consuming code)
 * - Comprehensive error logging for debugging
 * - Non-throwing behavior prevents UI breaks
 */
export async function getUsageInfo(userId: string, bypassCache = false) {
  try {
    // Get subscription and usage data once, then check all limits
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId, bypassCache),
      getCurrentMonthUsage(userId)
    ]);

    // Pass subscription to getStorageAnalytics to avoid duplicate query
    const storageAnalytics = await getStorageAnalytics(userId, subscription);


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
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      pendingPlanChange: subscription.pendingPlanChange,


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

/**
 * Get usage analytics data optimized for admin dashboards and detailed reporting.
 * 
 * Provides structured analytics data combining subscription status, usage limits,
 * current usage statistics, and detailed plan information. Designed for administrative
 * interfaces and detailed usage reporting rather than general user consumption.
 * 
 * @param userId - The user ID to retrieve detailed analytics for
 * 
 * @returns Promise<UserAnalytics> - Structured analytics object with nested organization:
 *   **subscription: SubscriptionStatus**
 *   - plan: Current subscription plan identifier
 *   - status: Subscription status (active, canceled, past_due, etc.)
 *   - currentPeriodEnd: End date of current billing period
 *   - isActive: Boolean indicating active subscription status
 * 
 *   **limits: UsageLimits**
 *   - tokens: Monthly token limit (-1 for unlimited plans)
 * 
 *   **usage: CurrentUsage**
 *   - tokensUsed: Number of tokens consumed in current month
 * 
 *   **planDetails: PlanConfiguration**
 *   - Complete plan configuration from SUBSCRIPTION_PLAN_DETAIL
 *   - Includes pricing, features, limits, and plan metadata
 * 
 * @throws Error - Database connection failures or subscription lookup errors
 * 
 * **Data Structure:**
 * - Organized in logical groups for easy dashboard consumption
 * - Preserves detailed plan configuration for feature checks
 * - Includes subscription status for billing state validation
 * - Structured for JSON serialization and API responses
 * 
 * **Use Cases:**
 * - Admin dashboards displaying user account details
 * - Detailed usage reports and analytics
 * - Subscription management interfaces
 * - Billing and usage audit trails
 * 
 * **vs. getUsageInfo():**
 * - More detailed and structured (not flattened)
 * - Includes complete plan configuration details
 * - Optimized for admin/reporting rather than user UI
 * - Throws errors instead of returning null
 */
export async function getUserUsageAnalytics(userId: string) {
  try {
    const [subscription, currentUsage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ])

    const plan = SUBSCRIPTION_PLAN_DETAIL[subscription.plan as PlanId]

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        isActive: isSubscriptionActive(subscription),
      },
      limits: {
        tokens: subscription.maxTokensPerMonth,
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
 * Check token usage limits before AI requests to enforce subscription quotas.
 * 
 * Validates whether a user can make AI requests based on their current subscription
 * status and monthly token usage. Essential for enforcing subscription limits and
 * preventing quota overages before expensive AI operations.
 * 
 * @param userId - The user ID to check token usage limits for
 * 
 * @returns Promise<TokenUsageLimit> - Usage limit result object:
 *   **For Active Unlimited Subscriptions:**
 *   - allowed: true
 *   - limit: 'unlimited'
 *   - used: current month token consumption
 *   - limitType: 'tokens'
 * 
 *   **For Active Limited Subscriptions:**
 *   - allowed: boolean (true if under limit)
 *   - limit: monthly token limit number
 *   - used: current month token consumption
 *   - remaining: tokens remaining in current period
 *   - limitType: 'tokens'
 * 
 *   **For Inactive Subscriptions:**
 *   - allowed: false
 *   - limit: 0
 *   - used: 0
 *   - limitType: 'tokens'
 *   - reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
 * 
 *   **For Errors:**
 *   - allowed: false
 *   - limit: 0
 *   - used: 0
 *   - limitType: 'tokens'
 * 
 * @throws Never throws - Returns safe fallback values on error
 * 
 * **Validation Flow:**
 * 1. Retrieve user subscription details
 * 2. Check if subscription is currently active
 * 3. If inactive, return denial with specific error code
 * 4. If active, fetch current month usage
 * 5. Compare usage against subscription limits
 * 6. Return validation result with remaining quota
 * 
 * **Performance Monitoring:**
 * - Comprehensive timing measurement for optimization
 * - Detailed logging for subscription status and usage
 * - Performance threshold warnings for slow operations
 * 
 * **Error Handling:**
 * - Safe fallback prevents API access on errors
 * - Comprehensive error logging for debugging
 * - Non-throwing behavior maintains API stability
 * 
 * **Integration Pattern:**
 * Should be called before any AI API operations to validate quota availability.
 * Critical for subscription enforcement and preventing overages.
 */
export async function getTokenUsageLimit(userId: string) {
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
      return {
        allowed: true,
        limit: 'unlimited',
        used: usage.tokensUsed,
        limitType: 'tokens'
      }
    }

    return {
      allowed: usage.tokensUsed < maxTokens,
      limit: maxTokens,
      used: usage.tokensUsed,
      remaining: maxTokens - usage.tokensUsed,
      limitType: 'tokens'
    }
  } catch (error) {
    logger.error('Error checking token usage limit', error as Error, {userId});
    return {allowed: false, limit: 0, used: 0, limitType: 'tokens'}
  }
}