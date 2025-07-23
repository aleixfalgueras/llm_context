import {logger} from '../logger'

import {cacheSubscription, getCachedSubscription} from './subscription-cache'
import {SubscriptionOperations} from "@/lib/database";
import {SubscriptionPlan, SubscriptionStatus, UserSubscription} from "@prisma/client";
import {SubscriptionWithValidation} from "@/types/subscription-types";

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
export async function getUserSubscription(userId: string, bypassCache = false): Promise<UserSubscription> {
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

    let subscription = await SubscriptionOperations.findByUserId(userId)

    // Create default basic subscription if none exists using upsert to prevent race conditions
    if (!subscription) {
      logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.basic } });
      subscription = await SubscriptionOperations.createDefaultBasicSubscription(userId)
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

 * **Validation Criteria:**
 * - Subscription status must be 'active'
 * - Current period end date must be in the future
 * - Returns false if subscription is null/undefined
 * - Returns false if currentPeriodEnd is missing
 */
export function isSubscriptionActive(subscription: any): boolean {
  if (!subscription) return false
  
  const now = new Date()
  const isStatusActive = subscription.status === SubscriptionStatus.active
  const isNotExpired = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
  
  return Boolean(isStatusActive && isNotExpired)
}

export async function getUserSubscriptionWithValidation(userId: string, bypassCache = false): Promise<SubscriptionWithValidation> {
  try {
    const subscription = await getUserSubscription(userId, bypassCache)
    const isActive = isSubscriptionActive(subscription)
    
    return {
      ...subscription,
      isActive
    }
  } catch (error) {
    logger.error('Error getting user subscription with validation', error as Error, { userId });
    throw error
  }
}
