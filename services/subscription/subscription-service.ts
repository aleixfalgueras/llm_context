import {logger} from '@/lib/logger'
import {SubscriptionUsageOperations} from '@/database'
import {cacheSubscription, getCachedSubscription, invalidateAllUserCaches} from '@/services/subscription/subscription-cache'
import {SubscriptionPlan, SubscriptionStatus, UserSubscription} from '@prisma/client'
import {SubscriptionWithValidation} from '@/lib/types/subscription-types'
import {clerkClient} from '@clerk/nextjs/server'
import {createCheckoutSession, STRIPE_PRICE_IDS} from '@/lib/stripe/stripe-utils'
import {releaseSubscriptionSchedule, scheduleSubscriptionDowngrade} from '@/lib/stripe/stripe-subscription'
import {isDowngrade} from "@/lib/utils/subscription-client-utils";


export class SubscriptionService {

  /**
   * Create default apprentice subscription for new users.
   * Used proactively during user signup to ensure subscription exists.
   * 
   * @param userId - The user ID to create subscription for
   * @param email - Optional email address to store with subscription
   * @returns Promise<UserSubscription> - The created subscription record
   * @throws Error if creation fails
   */
  static async createDefaultSubscription(userId: string, email?: string): Promise<UserSubscription> {
    try {
      logger.info('Creating default apprentice subscription for new user', { userId, metadata: { email } });
      
      // If email not provided, try to fetch from Clerk
      let userEmail = email;
      if (!userEmail) {
        try {
          const client = await clerkClient()
          const user = await client.users.getUser(userId)
          userEmail = user.emailAddresses[0]?.emailAddress
        } catch (clerkError) {
          logger.warn('Failed to fetch email from Clerk for new subscription', { userId });
          // Continue without email rather than failing subscription creation
        }
      }
      
      // Create the subscription using the existing database operation
      const subscription = await SubscriptionUsageOperations.createDefaultApprenticeSubscription(userId, userEmail);
      
      // Cache the newly created subscription
      await cacheSubscription(userId, subscription);
      
      logger.info('Successfully created default subscription', {
        userId,
        metadata: {
          email: userEmail,
          plan: subscription.plan,
          periodStart: subscription.currentPeriodStart?.toISOString(),
          periodEnd: subscription.currentPeriodEnd?.toISOString()
        }
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error creating default subscription', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get or create user subscription with intelligent caching and auto-creation.
   * Creates a default basic subscription if none exists for the user.
   *
   * @param userId - The user ID to retrieve subscription for
   * @param bypassCache - Optional flag to skip cache lookup and force fresh database query (default: false)
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

      // Create default apprentice subscription if none exists using upsert to prevent race conditions
      if (!subscription) {
        logger.info('Creating new user subscription', { userId, metadata: { plan: SubscriptionPlan.apprentice } });
        // Try to fetch email from Clerk for lazy creation
        let email: string | undefined;
        try {
          const client = await clerkClient()
          const user = await client.users.getUser(userId)
          email = user.emailAddresses[0]?.emailAddress
        } catch (clerkError) {
          logger.warn('Failed to fetch email from Clerk for lazy subscription creation', { userId });
        }
        subscription = await SubscriptionUsageOperations.createDefaultApprenticeSubscription(userId, email)
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
  static async updateSubscription(userId: string,
                                  updateData: Partial<Omit<UserSubscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>):
    Promise<UserSubscription> {
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
   * Clear schedule fields (used for Stripe subscription changes)
   */
  static async clearScheduleFields(userId: string): Promise<UserSubscription> {
    try {
      return await this.updateSubscription(userId, {
        pendingPlanChange: null,
        stripeScheduleId: null
      })
    } catch (error) {
      logger.error('Error clearing schedule fields', error as Error, { userId });
      throw error
    }
  }

  /**
   * Create checkout session handling both upgrades and downgrades through proper business logic
   */
  static async createCheckoutSession(userId: string, planId: SubscriptionPlan): Promise<{
    isDowngrade: boolean
    message?: string
    effectiveDate?: string
    url?: string | null
  }> {
    try {
      if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
        logger.warn('Invalid plan ID provided', { metadata: { planId } })
        throw new Error('Invalid plan ID')
      }

      const priceId = STRIPE_PRICE_IDS[planId]
      if (!priceId) {
        logger.warn('No price ID found for plan', { metadata: { planId } })
        throw new Error('Price not found')
      }

      // Check if user has existing subscription through service layer
      const existingSubscription = await SubscriptionUsageOperations.findByUserId(userId)

      // If user has active subscription and this is a downgrade, handle downgrade scheduling
      if (existingSubscription?.stripeSubscriptionId && 
          isDowngrade(existingSubscription.plan as SubscriptionPlan, planId)) {
        
        logger.info('Detected downgrade request, handling downgrade scheduling', {
          userId,
          metadata: {
            currentPlan: existingSubscription.plan,
            targetPlan: planId
          }
        })
        
        // Schedule the downgrade using shared utility function
        const { effectiveDate, message } = await scheduleSubscriptionDowngrade(
          existingSubscription.stripeSubscriptionId,
          priceId,
          userId,
          existingSubscription.plan as SubscriptionPlan,
          planId
        )

        return {
          isDowngrade: true,
          message,
          effectiveDate: effectiveDate.toISOString()
        }
      }

      // Get user email from Clerk for upgrades/new subscriptions
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const email = user.emailAddresses[0]?.emailAddress

      if (!email) {
        logger.warn('No email found for user', { userId })
        throw new Error('User email not found')
      }

      const session = await createCheckoutSession(userId, email, priceId, planId)

      // All customers now go through checkout flow (for upgrades/new subscriptions)
      logger.info('Checkout session created successfully', { 
        userId, 
        metadata: {
          planId, 
          checkoutUrl: session.url
        }
      })

      return {
        isDowngrade: false,
        url: session.url
      }
    } catch (error) {
      logger.error('Error creating checkout session', error as Error, { userId });
      throw error
    }
  }

  /**
   * Cancel pending subscription downgrade through proper business logic
   */
  static async cancelDowngrade(userId: string): Promise<{
    message: string
    currentPlan: string
  }> {
    try {
      // Get current subscription to check for pending downgrade through database layer
      const subscription = await SubscriptionUsageOperations.findByUserId(userId)

      if (!subscription) {
        logger.warn('No subscription found for downgrade cancellation', { userId })
        throw new Error('No subscription found')
      }

      if (!subscription.stripeScheduleId || !subscription.pendingPlanChange) {
        logger.warn('No pending downgrade found to cancel', { 
          userId,
          metadata: {
            hasScheduleId: !!subscription.stripeScheduleId,
            hasPendingPlanChange: !!subscription.pendingPlanChange,
            currentPlan: subscription.plan
          }
        })
        throw new Error('No pending downgrade found to cancel')
      }

      // Release the Stripe subscription schedule
      await releaseSubscriptionSchedule(subscription.stripeScheduleId, subscription.stripeSubscriptionId)
      logger.info('Successfully cancelled subscription downgrade', {
        userId,
        metadata: {
          scheduleId: subscription.stripeScheduleId,
          canceledPlan: subscription.pendingPlanChange,
          currentPlan: subscription.plan
        }
      })

      // Clear schedule fields in database through service layer
      await this.clearScheduleFields(userId)

      // Invalidate all user caches after canceling downgrade
      await invalidateAllUserCaches(userId)

      return {
        message: 'Subscription downgrade canceled successfully',
        currentPlan: subscription.plan
      }
    } catch (error) {
      logger.error('Error canceling downgrade', error as Error, { userId });
      throw error
    }
  }
}