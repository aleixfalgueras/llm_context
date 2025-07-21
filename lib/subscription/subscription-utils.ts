import {logger} from '../logger'
import {SubscriptionPlan, SubscriptionStatus} from '@/types/subscription-types'

import {cacheSubscription, getCachedSubscription} from './subscription-cache'
import {SubscriptionOperations} from "@/lib/database";

// Get or create user subscription
export async function getUserSubscription(userId: string, bypassCache = false) {
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
      logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.BASIC } });
      
      logger.dbQuery('upsert', 'userSubscription', { userId });
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

// Check if subscription is active and not expired
export function isSubscriptionActive(subscription: any) {
  if (!subscription) return false
  
  const now = new Date()
  const isStatusActive = subscription.status === SubscriptionStatus.ACTIVE
  const isNotExpired = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now
  
  return isStatusActive && isNotExpired
}
