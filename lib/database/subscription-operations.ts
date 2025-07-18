/**
 * Subscription-specific database operations
 */

import {prisma} from '../prisma'
import {logger} from '../logger'
import {BaseOperations} from './base-operations'
import {SubscriptionStatus, SubscriptionPlan, SUBSCRIPTION_PLAN_DETAIL} from '@/types/subscription-types'
import {invalidateAllUserCaches} from '../payments/subscription-cache'
import {getPlanFromPriceId, mapStripeStatusToSubscriptionStatus} from "@/lib/payments/stripe-utils";

export class SubscriptionOperations extends BaseOperations {
  /**
   * Find user subscription by userId
   */
  static async findByUserId(userId: string) {
    try {
      return await prisma.userSubscription.findUnique({
        where: { userId },
      })
    } catch (error) {
      logger.error('Failed to find subscription by userId', error as Error, { userId })
      throw error
    }
  }

  /**
   * Upsert user subscription
   */
  static async upsertSubscription(
    userId: string,
    updateData: Partial<any> = {},
    createData: Partial<any> = {}
  ) {
    try {
      return await prisma.userSubscription.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...createData
        }
      })
    } catch (error) {
      logger.error('Failed to upsert subscription', error as Error, { userId })
      throw error
    }
  }

  /**
   * Create default basic subscription for new users
   */
  static async createDefaultBasicSubscription(userId: string) {
    try {
      const now = new Date()
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days

      return await this.upsertSubscription(
        userId,
        {}, // Don't update if exists
        {
          plan: SubscriptionPlan.BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          maxClients: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.BASIC].maxClients,
          maxTokensPerMonth: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.BASIC].maxTokensPerMonth,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
        }
      )
    } catch (error) {
      logger.error('Failed to create default basic subscription', error as Error, { userId })
      throw error
    }
  }

  /**
   * Upsert subscription with Stripe customer ID
   */
  static async upsertWithStripeCustomer(userId: string, stripeCustomerId: string) {
    try {
      return await this.upsertSubscription(
        userId,
        { stripeCustomerId },
        {
          stripeCustomerId,
          plan: SubscriptionPlan.BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          maxClients: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.BASIC].maxClients,
          maxTokensPerMonth: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.BASIC].maxTokensPerMonth,
          cancelAtPeriodEnd: false,
          pendingPlanChange: null,
        }
      )
    } catch (error) {
      logger.error('Failed to upsert subscription with Stripe customer',
        error as Error,
        { userId , metadata: { stripeCustomerId }})
      throw error
    }
  }

  /**
   * Update subscription in database with comprehensive handling
   */
  static async updateSubscriptionInDatabase(
    subscriptionId: string,
    customerId: string,
    status: string,
    currentPeriodStart: number,
    currentPeriodEnd: number,
    priceId?: string,
    canceledAt?: number | null,
    cancelAtPeriodEnd?: boolean,
    pendingPlanChange?: string | null,
    stripeScheduleId?: string | null
  ) {
    try {
      const subscription = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: customerId },
      })

      if (!subscription) {
        logger.warn('No subscription found for customer', { metadata: { customerId } })
        return
      }

      const plan = priceId ? getPlanFromPriceId(priceId) : subscription.plan
      const subscriptionStatus = mapStripeStatusToSubscriptionStatus(status)

      // Get plan limits from SUBSCRIPTION_PLANS when plan changes
      const planLimits = plan && plan !== subscription.plan ? SUBSCRIPTION_PLAN_DETAIL[plan] : null

      const updateData: any = {
        stripeSubscriptionId: subscriptionId,
        plan: plan || subscription.plan,
        status: subscriptionStatus,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        stripePriceId: priceId || subscription.stripePriceId,
        updatedAt: new Date(),
      }

      // Handle cancelAtPeriodEnd field
      if (cancelAtPeriodEnd !== undefined) {
        updateData.cancelAtPeriodEnd = cancelAtPeriodEnd
      }

      // Handle pendingPlanChange field
      if (pendingPlanChange !== undefined) {
        updateData.pendingPlanChange = pendingPlanChange
      }

      // Handle stripeScheduleId field
      if (stripeScheduleId !== undefined) {
        updateData.stripeScheduleId = stripeScheduleId
      }

      // Handle canceledAt timestamp
      if (subscriptionStatus === SubscriptionStatus.CANCELED && canceledAt) {
        // Stripe provided a canceledAt timestamp (immediate cancellation)
        updateData.canceledAt = new Date(canceledAt * 1000)
      } else if (subscriptionStatus === SubscriptionStatus.CANCELED && !canceledAt && !subscription.canceledAt) {
        // Subscription is canceled but no timestamp from Stripe and no existing timestamp
        // This shouldn't happen in normal flow, but we'll set current time as fallback
        updateData.canceledAt = new Date()
        logger.warn('Subscription canceled without canceledAt timestamp', {
          metadata: {
            subscriptionId,
            customerId,
            status: subscriptionStatus
          }
        })
      } else if (subscriptionStatus !== SubscriptionStatus.CANCELED && subscription.canceledAt) {
        // Clear canceledAt if subscription transitions from canceled to active (reactivated)
        updateData.canceledAt = null
        logger.info('Clearing canceledAt for reactivated subscription', {
          metadata: {
            subscriptionId,
            customerId,
            previousCanceledAt: subscription.canceledAt
          }
        })
      } else if (canceledAt === null && subscription.canceledAt) {
        // Explicitly clear canceledAt when null is passed (e.g., during upgrades)
        updateData.canceledAt = null
        logger.info('Explicitly clearing canceledAt field', {
          metadata: {
            subscriptionId,
            customerId,
            previousCanceledAt: subscription.canceledAt,
            reason: 'explicit_null_passed'
          }
        })
      }

      // Update plan limits if plan changed
      if (planLimits) {
        updateData.maxClients = planLimits.maxClients
        updateData.maxTokensPerMonth = planLimits.maxTokensPerMonth
      }

      const updatedSubscription = await prisma.$transaction(async (tx) => {
        return tx.userSubscription.update({
          where: {id: subscription.id},
          data: updateData,
        });
      })

      logger.info('Updated subscription in database', {
        userId: subscription.userId,
        metadata: {
          subscriptionId,
          previousSubscriptionId: subscription.stripeSubscriptionId,
          newSubscriptionId: updatedSubscription.stripeSubscriptionId,
          subscriptionIdChanged: subscription.stripeSubscriptionId !== updatedSubscription.stripeSubscriptionId,
          plan: updatedSubscription.plan,
          status: updatedSubscription.status,
          maxClients: updatedSubscription.maxClients,
          maxTokensPerMonth: updatedSubscription.maxTokensPerMonth,
          planLimitsUpdated: !!planLimits,
          canceledAtChanged: subscription.canceledAt !== updatedSubscription.canceledAt,
          previousCanceledAt: subscription.canceledAt,
          newCanceledAt: updatedSubscription.canceledAt,
          stripeCanceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
          cancelAtPeriodEndChanged: subscription.cancelAtPeriodEnd !== updatedSubscription.cancelAtPeriodEnd,
          previousCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          newCancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
          pendingPlanChangeChanged: subscription.pendingPlanChange !== updatedSubscription.pendingPlanChange,
          previousPendingPlanChange: subscription.pendingPlanChange,
          newPendingPlanChange: updatedSubscription.pendingPlanChange
        }
      })

      // Invalidate all user caches after successful update
      await invalidateAllUserCaches(subscription.userId)

      return updatedSubscription
    } catch (error) {
      logger.error('Failed to update subscription in database', error as Error, {
        metadata: {
          subscriptionId,
          customerId,
        }
      })
      throw error
    }
  }
}