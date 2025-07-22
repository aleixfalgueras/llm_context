import {cacheUsage, getCachedUsage, invalidateUsageCache} from "@/lib/subscription/subscription-cache";
import {logger} from "@/lib/logger";
import {prisma} from "@/lib/prisma";
import {getUserSubscription, getUserSubscriptionWithValidation} from "@/lib/subscription/subscription-utils";
import {ApiSubscriptionErrorCode} from "@/types/enums";
import {getStorageSubscriptionUsage} from "@/lib/utils/storage";
import {TokenUsageValidationResult} from "@/types/middleware-validation-types";
import {SubscriptionUsage, UsageInfo} from "@/types/subscription-usage-types";
import {UserUsage} from "@prisma/client";

/**
 * Get the current billing period dates from a user's subscription.
 * 
 * @param userId - The user ID to get billing period for
 * @returns Promise<{periodStart: Date, periodEnd: Date}> - Current billing period dates
 * @throws Error - If subscription not found or invalid
 */
async function getCurrentBillingPeriod(userId: string): Promise<{periodStart: Date, periodEnd: Date}> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    throw new Error('Subscription missing billing period dates');
  }
  
  return {
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd
  };
}

/**
 * Get current billing period usage data with intelligent caching and auto-creation.
 *
 * Retrieves the user's usage statistics for the current subscription billing period,
 * implementing a multi-layer approach with caching, database queries, and automatic
 * record creation to ensure consistent data availability.
 *
 * @param userId - The user ID to retrieve usage data for
 *
 * @returns Promise<UserUsage> - Complete usage record with the following structure:
 *
 * @throws Error - Database connection or query failures
 *
 * **Caching Strategy:**
 * - First checks Redis cache with key format: `{userId}_{periodStart}_{periodEnd}`
 * - Cache TTL optimized for usage data freshness requirements
 * - Cache populated after successful database queries
 *
 * **Auto-Creation Logic:**
 * - Uses upsert operation to prevent race conditions during record creation
 * - Creates new usage record with zero tokens if none exists for current billing period
 * - Logs creation events for monitoring and debugging
 *
 * **Performance Monitoring:**
 * - Database operations timed with performance threshold
 * - Comprehensive error logging with contextual metadata
 * - Debug logging for cache hits to monitor cache effectiveness
 *
 * **Usage Pattern:**
 * Called frequently by usage validation and display components.
 * Essential for subscription limit enforcement aligned with billing periods.
 */
export async function getCurrentBillingPeriodUsage(userId: string): Promise<UserUsage> {
  try {
    // Get current billing period from subscription
    const { periodStart, periodEnd } = await getCurrentBillingPeriod(userId);

    // Check cache first (shorter TTL for usage data)
    const cacheKey = `${userId}_${periodStart.toISOString()}_${periodEnd.toISOString()}`
    const cached = await getCachedUsage(cacheKey)
    if (cached) {
      logger.debug('Returning cached usage', {
        userId,
        metadata: {
          billingPeriodStart: periodStart.toISOString(),
          billingPeriodEnd: periodEnd.toISOString()
        }
      })
      return cached
    }

    let usage = await prisma.userUsage.findUnique({
      where: {
        userId_billingPeriodStart_billingPeriodEnd: {
          userId,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd
        }
      }
    })

    // Create usage record if none exists for current billing period using upsert to prevent race conditions
    if (!usage) {
      logger.info('Creating new user usage record for billing period', {
        userId,
        metadata: {
          billingPeriodStart: periodStart.toISOString(),
          billingPeriodEnd: periodEnd.toISOString()
        }
      });

      logger.dbQuery('upsert', 'userUsage', {userId});
      usage = await prisma.userUsage.upsert({
        where: {
          userId_billingPeriodStart_billingPeriodEnd: {
            userId,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd
          }
        },
        update: {}, // Don't update if exists
        create: {
          userId,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          tokensUsed: 0,
        }
      })
    }

    // Cache the result
    await cacheUsage(cacheKey, usage)

    return usage
  } catch (error) {
    logger.error('Error getting current billing period usage', error as Error, {
      userId
    });
    throw error
  }
}

/**
 * Get unified subscription and usage data for a user in a single call.
 * This function is optimized for token validation flows where
 * both subscription status and usage data are needed together.
 *
 * @param userId - The user ID to retrieve data for
 *
 * @param bypassCache
 * @returns Promise<SubscriptionUsage> - Combined subscription and usage data:
 *   **subscription**: Current subscription details including plan, status, limits
 *   **usage**: Current month token usage and period information
 *
 * @throws Error - Database connection or query failures
 *
 * **Performance Benefits:**
 * - Single cache lookup for combined data when possible
 * - Parallel data fetching when cache miss occurs
 * - Eliminates redundant subscription status checks
 * - Optimized for high-frequency validation operations
 *
 * **Usage Pattern:**
 * Primary function for token validation and usage display components.
 * Replaces separate calls to getUserSubscription() and getCurrentBillingPeriodUsage().
 */
export async function getUserSubscriptionUsage(userId: string, bypassCache = false): Promise<SubscriptionUsage> {
  try {
    // Fetch subscription and usage data in parallel for optimal performance
    const [subscription, usage] = await Promise.all([
      getUserSubscriptionWithValidation(userId, bypassCache),
      getCurrentBillingPeriodUsage(userId)
    ]);

    return {
      subscription,
      usage
    };
  } catch (error) {
    logger.error('Error getting user subscription usage data', error as Error, { userId });
    throw error;
  }
}

/**
 * Get comprehensive usage information optimized for client-side display and validation.
 * 
 * Aggregates subscription details, token usage, and storage analytics into a structured
 * UsageInfo object. Combines multiple data sources to provide a complete view of user
 * account status and usage limits with properly formatted values.
 * 
 * @param userId - The user ID to retrieve comprehensive usage info for
 * @param bypassCache - Optional flag to force fresh data retrieval (default: false)
 * 
 * @returns Promise<UsageInfo | null> - Comprehensive usage object with structured format:
 *   **subscriptionUsage**: Contains subscription details and token usage
 *   **storageSubscriptionUsage**: Contains storage usage with formatted values
 * 
 * @returns null if error occurs (logged but not thrown)
 * 
 * **Data Integration:**
 * - Fetches subscription and usage data in parallel for performance
 * - Uses formatted storage values from StorageSubscriptionUsage
 * - Provides properly structured data for type-safe consumption
 * 
 * **Error Handling:**
 * - Returns null on any error (check for null in consuming code)
 * - Comprehensive error logging for debugging
 * - Non-throwing behavior prevents UI breaks
 */
export async function getUserUsageInfo(userId: string, bypassCache = false): Promise<UsageInfo | null> {
  try {
    const [subscriptionUsage, storageSubscriptionUsage] = await Promise.all([
      getUserSubscriptionUsage(userId, bypassCache),
      getStorageSubscriptionUsage(userId)
    ]);

    return {
      subscriptionUsage,
      storageSubscriptionUsage
    };
  } catch (error) {
    console.error('Error getting usage info:', error)
    return null
  }
}

/**
 * Check token usage limits before AI requests to enforce subscription quotas.
 * 
 * Validates whether a user can make AI requests based on their current subscription
 * status and monthly token usage. Now uses the unified data service for improved
 * performance and consistency.
 * 
 * @param userId - The user ID to check token usage limits for
 * 
 * @returns Promise<TokenUsageValidationResult> - Standardized validation result object
 * 
 * @throws Never throws - Returns safe fallback values on error
 * 
 * **Optimized Implementation:**
 * - Uses unified getUserLimitsAndUsage() for single data fetch
 * - Eliminates redundant subscription status checks
 * - Consistent return structure via TokenValidationResult interface
 * - Better error handling with proper fallback values
 */
export async function getTokenUsageValidationResult(userId: string): Promise<TokenUsageValidationResult> {
  try {
    const subscriptionUsage = await getUserSubscriptionUsage(userId);

    // Check if subscription is active first
    if (!subscriptionUsage.subscription.isActive) {
      logger.warn('Subscription is not active for token usage limit check', {
        userId,
        metadata: {
          plan: subscriptionUsage.subscription.plan,
          status: subscriptionUsage.subscription.status,
          currentPeriodEnd: subscriptionUsage.subscription.currentPeriodEnd
        }
      });
      return {
        allowed: false,
        limit: 0,
        used: 0,
        limitType: 'tokens',
        reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
      };
    }

    const tokenLimit = subscriptionUsage.subscription.tokenLimit;
    const tokensUsed = subscriptionUsage.usage.tokensUsed;

    return {
      allowed: tokensUsed < tokenLimit,
      limit: tokenLimit,
      used: tokensUsed,
      remaining: Math.max(0, tokenLimit - tokensUsed),
      limitType: 'tokens'
    };
  } catch (error) {
    logger.error('Error checking token usage limit', error as Error, { userId });
    return {
      allowed: false,
      limit: 0,
      used: 0,
      limitType: 'tokens'
    };
  }
}

/**
 * Track usage after successful API completion by updating billing period usage records.
 *
 * This function increments the user's token usage for the current billing period and
 * invalidates the cache to ensure fresh data on subsequent requests. It uses upsert to
 * handle cases where the billing period usage record doesn't exist yet.
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
 * - Creates new billing period usage record if none exists for current period
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
    // Get current billing period
    const { periodStart, periodEnd } = await getCurrentBillingPeriod(userId);

    const updateData: any = {}

    if (metadata?.tokensUsed) {
      updateData.tokensUsed = { increment: metadata.tokensUsed }
    }

    const result = await prisma.userUsage.upsert({
      where: {
        userId_billingPeriodStart_billingPeriodEnd: {
          userId,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd
        }
      },
      create: {
        userId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        tokensUsed: metadata?.tokensUsed || 0,
      },
      update: updateData
    })

    logger.info('Updated tokensUsed for billing period', {
      userId,
      tokensUsed: result.tokensUsed,
      metadata: {
        billingPeriodStart: periodStart.toISOString(),
        billingPeriodEnd: periodEnd.toISOString()
      }
    });

    // Invalidate usage cache after update
    const cacheKey = `${userId}_${periodStart.toISOString()}_${periodEnd.toISOString()}`
    await invalidateUsageCache(cacheKey)

  } catch (error) {
    logger.error('Error tracking usage', error as Error, { userId });
    // Don't throw error as this shouldn't break the main functionality
  }
}