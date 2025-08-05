/**
 * Subscription and Usage business logic service
 * Combines subscription management and usage tracking functionality
 */

import { logger } from '@/lib/logger'
import { SubscriptionUsageOperations } from '@/database'
import { 
  cacheSubscription, 
  getCachedSubscription, 
  cacheUsage, 
  getCachedUsage, 
  invalidateUsageCache,
  invalidateAllUserCaches 
} from '@/lib/subscription/subscription-cache'
import { getStorageSubscriptionUsage } from '@/lib/utils/storage'
import {
  UserSubscription, 
  UserUsage, 
  SubscriptionPlan, 
  SubscriptionStatus 
} from '@prisma/client'
import { SubscriptionWithValidation } from '@/lib/types/subscription-types'
import { 
  SubscriptionUsage, 
  UsageInfo 
} from '@/lib/types/subscription-usage-types'
import {SubscriptionErrorCode} from "@/lib/api/api-error-codes";

export class SubscriptionUsageService {

  /**
   * Get or create user subscription with intelligent caching and auto-creation.
   *
   * Retrieves the user's subscription record with a multi-layer approach using caching,
   * database queries, and automatic record creation to ensure consistent data availability.
   * Creates a default basic subscription if none exists for the user.
   *
   * @param userId - The user ID to retrieve subscription for
   * @param bypassCache - Optional flag to skip cache lookup and force fresh database query (default: false)
   *
   * @returns Promise<UserSubscription> - Complete subscription record from database
   *
   * @throws Error - Database connection failures or subscription creation errors
   *
   * **Caching Strategy:**
   * - First checks Redis cache for existing subscription data
   * - Cache populated after successful database queries
   * - Bypass cache option available for critical operations
   *
   * **Auto-Creation Logic:**
   * - Creates default basic subscription if none exists for user
   * - Uses database operations to prevent race conditions
   * - Logs creation events for monitoring and debugging
   */
  static async getUserSubscription(userId: string, bypassCache = false): Promise<UserSubscription> {
    try {
      // Check cache first (unless bypassing cache)
      if (!bypassCache) {
        const cached = await getCachedSubscription(userId)
        if (cached) {
          logger.info('Returning cached subscription', { userId })
          return cached
        }
      } else {
        logger.info('Bypassing cache for subscription fetch', { userId })
      }

      let subscription = await SubscriptionUsageOperations.findByUserId(userId)

      // Create default basic subscription if none exists using upsert to prevent race conditions
      if (!subscription) {
        logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.basic } });
        subscription = await SubscriptionUsageOperations.createDefaultBasicSubscription(userId)
      }

      // Cache the result
      await cacheSubscription(userId, subscription)

      return subscription
    } catch (error) {
      logger.error('Error getting user subscription', error as Error, { userId });
      throw error
    }
  }

  /**
   * Check if subscription is active and not expired based on status and period dates.
   * Validates a subscription's active state by checking both the subscription status
   * and whether the current period end date is in the future. Both conditions must
   * be true for the subscription to be considered active.
   *
   * **Validation Criteria:**
   * - Subscription status must be 'active'
   * - Current period end date must be in the future
   * - Returns false if subscription is null/undefined
   * - Returns false if currentPeriodEnd is missing
   */
  static isSubscriptionActive(subscription: any): boolean {
    if (!subscription) return false
    
    const now = new Date()
    const isStatusActive = subscription.status === SubscriptionStatus.active
    const isNotExpired = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
    
    return Boolean(isStatusActive && isNotExpired)
  }

  /**
   * Get user subscription with validation status
   */
  static async getUserSubscriptionWithValidation(userId: string, bypassCache = false): Promise<SubscriptionWithValidation> {
    try {
      const subscription = await this.getUserSubscription(userId, bypassCache)
      const isActive = this.isSubscriptionActive(subscription)
      
      return {
        ...subscription,
        isActive
      }
    } catch (error) {
      logger.error('Error getting user subscription with validation', error as Error, { userId });
      throw error
    }
  }

  /**
   * Update existing subscription
   */
  static async updateSubscription(userId: string, updateData: Partial<Omit<UserSubscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<UserSubscription> {
    try {
      const subscription = await SubscriptionUsageOperations.updateSubscription(userId, updateData)
      
      // Invalidate all user caches after subscription update
      await invalidateAllUserCaches(userId)
      
      return subscription
    } catch (error) {
      logger.error('Error updating subscription', error as Error, { userId });
      throw error
    }
  }

  /**
   * Get the current billing period dates from a user's subscription.
   * 
   * @param userId - The user ID to get billing period for
   * @returns Promise<{periodStart: Date, periodEnd: Date}> - Current billing period dates
   * @throws Error - If subscription not found or invalid
   */
  static async getCurrentBillingPeriod(userId: string): Promise<{periodStart: Date, periodEnd: Date}> {
    const subscription = await this.getUserSubscription(userId);
    
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
  static async getCurrentBillingPeriodUsage(userId: string): Promise<UserUsage> {
    try {
      // Get current billing period from subscription
      const { periodStart, periodEnd } = await this.getCurrentBillingPeriod(userId);

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

      let usage = await SubscriptionUsageOperations.findUsageByPeriod(userId, periodStart, periodEnd)

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
        usage = await SubscriptionUsageOperations.upsertUsage(userId, periodStart, periodEnd)
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
  static async getUserSubscriptionUsage(userId: string, bypassCache = false): Promise<SubscriptionUsage> {
    try {
      // Fetch subscription and usage data in parallel for optimal performance
      const [subscription, usage] = await Promise.all([
        this.getUserSubscriptionWithValidation(userId, bypassCache),
        this.getCurrentBillingPeriodUsage(userId)
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
  static async getUserUsageInfo(userId: string, bypassCache = false): Promise<UsageInfo | null> {
    try {
      const [subscriptionUsage, storageSubscriptionUsage] = await Promise.all([
        this.getUserSubscriptionUsage(userId, bypassCache),
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

   * @param userId - The user ID to check token usage limits for
   * @returns Promise<boolean>
   **
   */
  static async isTokenUsageAllowed(userId: string): Promise<boolean> {
    try {
      const subscriptionUsage = await this.getUserSubscriptionUsage(userId);

      if (!subscriptionUsage.subscription.isActive) {
        throw new Error(SubscriptionErrorCode.SUBSCRIPTION_EXPIRED)
      }

      const tokenLimit = subscriptionUsage.subscription.tokenLimit;
      const tokensUsed = subscriptionUsage.usage.tokensUsed;

      return tokensUsed < tokenLimit

    } catch (error) {
      logger.error('Error checking token usage limit', error as Error, { userId });
      throw error
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
  static async trackUsage(
    userId: string,
    metadata?: {
      tokensUsed?: number
      model?: string
      [key: string]: any
    }
  ): Promise<void> {
    try {
      // Get current billing period
      const { periodStart, periodEnd } = await this.getCurrentBillingPeriod(userId);

      if (metadata?.tokensUsed) {
        const result = await SubscriptionUsageOperations.incrementUsage(
          userId,
          periodStart,
          periodEnd,
          metadata.tokensUsed
        );

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
      }
    } catch (error) {
      logger.error('Error tracking usage', error as Error, { userId });
      // Don't throw error as this shouldn't break the main functionality
    }
  }

  /**
   * Clear schedule fields (used for Stripe subscription changes)
   */
  static async clearScheduleFields(userId: string): Promise<UserSubscription> {
    try {
      const subscription = await SubscriptionUsageOperations.clearScheduleFields(userId)
      
      // Invalidate subscription cache
      await invalidateAllUserCaches(userId)
      
      return subscription
    } catch (error) {
      logger.error('Error clearing schedule fields', error as Error, { userId });
      throw error
    }
  }
}