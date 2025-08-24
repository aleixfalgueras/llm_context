import {logger} from '@/lib/logger'
import {SubscriptionUsageOperations} from '@/database'
import {cacheUsage, getCachedUsage, invalidateUsageCache, cacheStorageSubscriptionUsage, getCachedStorageSubscriptionUsage} from '@/services/subscription/subscription-cache'
import {UserUsage} from '@prisma/client'
import {SubscriptionUsage, UsageInfo, StorageSubscriptionUsage} from '@/lib/types/subscription-usage-types'
import {SubscriptionErrorCode} from "@/services/error-codes"
import {SubscriptionService} from './subscription-service'
import {getStorageLimitForPlan} from '@/lib/types/storage-types'


export class SubscriptionUsageService {

  /**
   * Create default usage record for new users.
   * Used proactively during user signup to ensure usage record exists for current billing period.
   * 
   * @param userId - The user ID to create usage record for
   * @returns Promise<UserUsage> - The created usage record with zero tokens
   * @throws Error if creation fails or subscription doesn't exist
   */
  static async createDefaultUsage(userId: string): Promise<UserUsage> {
    try {
      logger.info('Creating default usage record for new user', { userId });
      
      // Get the subscription to retrieve billing period dates
      const subscription = await SubscriptionService.getUserSubscription(userId);
      
      if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
        throw new Error('Subscription missing billing period dates');
      }
      
      // Create usage record with zero tokens for the current billing period
      const usage = await SubscriptionUsageOperations.upsertUsage(
        userId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        { tokensUsed: 0 }
      );
      
      // Cache the newly created usage record
      const cacheKey = `${userId}_${subscription.currentPeriodStart.toISOString()}_${subscription.currentPeriodEnd.toISOString()}`;
      await cacheUsage(cacheKey, usage);
      
      logger.info('Successfully created default usage record', {
        userId,
        metadata: {
          billingPeriodStart: subscription.currentPeriodStart.toISOString(),
          billingPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          tokensUsed: 0
        }
      });
      
      return usage;
    } catch (error) {
      logger.error('Error creating default usage record', error as Error, { userId });
      throw error;
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
    const subscription = await SubscriptionService.getUserSubscription(userId);
    
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
   **
   * **Caching Strategy:**
   * - First checks Redis cache with key format: `{userId}_{periodStart}_{periodEnd}`
   * - Cache TTL optimized for usage data freshness requirements
   * - Cache populated after successful database queries
   *
   * **Auto-Creation Logic:**
   * - Uses upsert operation to prevent race conditions during record creation
   * - Creates new usage record with zero tokens if none exists for current billing period
   * - Logs creation events for monitoring and debugging
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
        SubscriptionService.getUserSubscriptionWithValidation(userId, bypassCache),
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
        this.getStorageSubscriptionUsage(userId)
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
   * Get comprehensive storage usage for a user with subscription context.
   * 
   * Combines storage usage data with subscription plan limits to provide formatted
   * analytics including usage percentages, remaining space, and formatted values.
   * Implements intelligent caching and parallel data fetching for performance.
   * 
   * @param userId - The user ID to get storage analytics for
   * @param subscription - Optional subscription data, fetched if not provided
   * @returns Promise<StorageSubscriptionUsage> with usage data, limits, and formatted values
   * @throws Error if data fetching or calculation fails
   * 
   * **Performance Features:**
   * - Redis caching with automatic cache population
   * - Parallel fetching of subscription and usage data
   * - Optimized for frequent usage validation calls
   */
  static async getStorageSubscriptionUsage(userId: string, subscription?: any): Promise<StorageSubscriptionUsage> {
    const {StorageService} = await import('../storage-service')
    
    try {
      // Check cache first
      const cached = await getCachedStorageSubscriptionUsage(userId)
      if (cached) {
        return cached
      }

      // If subscription is provided, use it; otherwise fetch it
      const [userSubscription, storageUsage] = await Promise.all([
        subscription ? Promise.resolve(subscription) : SubscriptionService.getUserSubscription(userId),
        StorageService.getStorageUsage(userId)
      ])

      const storageLimit = getStorageLimitForPlan(userSubscription.plan)

      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      const storageSubscriptionUsage = {
        usage: storageUsage,
        limit: storageLimit,
        limitFormatted: formatBytes(storageLimit),
        usedFormatted: formatBytes(storageUsage.totalBytes),
        usagePercentage: Math.round((storageUsage.totalBytes / storageLimit) * 100),
        remainingFormatted: formatBytes(Math.max(0, storageLimit - storageUsage.totalBytes))
      }

      // Cache the result
      await cacheStorageSubscriptionUsage(userId, storageSubscriptionUsage)

      return storageSubscriptionUsage
    } catch (error) {
      logger.error('Error getting storage analytics', error as Error, { userId })
      throw error
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

        logger.debug('Updated tokensUsed for billing period', {
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

}