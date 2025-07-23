import {stripe} from '@/lib/stripe/stripe'
import {logger} from '../logger'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/types/subscription-types'
import {getPlanFromPriceId} from "@/lib/stripe/stripe-utils"
import {prisma} from '../prisma'
import {invalidateAllUserCaches} from '../subscription/subscription-cache'
import {SubscriptionOperations} from "@/lib/database";
import Stripe from "stripe";
import {SubscriptionPlan, SubscriptionStatus} from '@prisma/client'

/**
 * Cancels a Stripe subscription immediately without proration or additional invoicing.
 * Used for scenarios like subscription upgrades where the old subscription needs to be
 * terminated immediately to avoid conflicts.
 * 
 * @param subscriptionId - The Stripe subscription ID to cancel
 * @param reason - The reason for cancellation (default: 'user_request')
 * @returns Promise<Stripe.Subscription> - The cancelled Stripe subscription object
 * @throws Error if the cancellation fails
 */
export async function cancelSubscriptionImmediately(subscriptionId: string, reason: string = 'user_request') {
  try {
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId, {
      prorate: false,
      invoice_now: false,
    })

    logger.info('Successfully canceled subscription immediately', {
      metadata: {
        subscriptionId,
        reason,
        canceledAt: canceledSubscription.canceled_at
      }
    })

    return canceledSubscription
  } catch (error) {
    logger.error('Failed to cancel subscription immediately', error as Error, {
      metadata: {
        subscriptionId,
        reason
      }
    })
    throw error
  }
}

/**
 * Maps Stripe subscription status strings to internal SubscriptionStatus enum values.
 * Handles all possible Stripe subscription statuses and provides fallback mapping.
 * 
 * @param stripeStatus - The status string from Stripe (e.g., 'active', 'canceled', 'past_due')
 * @returns SubscriptionStatus - The corresponding internal status enum value
 */
export function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.active
    case 'canceled':
      return SubscriptionStatus.canceled
    case 'past_due':
      return SubscriptionStatus.past_due
    case 'incomplete':
    case 'incomplete_expired':
      return SubscriptionStatus.incomplete
    case 'unpaid':
      return SubscriptionStatus.unpaid
    default:
      return SubscriptionStatus.incomplete
  }
}

/**
 * Releases (cancels) a Stripe subscription schedule, allowing the subscription to continue
 * without being controlled by the schedule. This is typically used when changing or cancelling
 * pending subscription modifications.
 * 
 * @param schedule - Either a schedule ID string or a Stripe.SubscriptionSchedule object
 * @param stripeSubscriptionId - The subscription ID for logging purposes (can be null)
 * @throws Error if the schedule release fails
 */
export async function releaseSubscriptionSchedule(
  schedule: string | Stripe.SubscriptionSchedule,
  stripeSubscriptionId: string | null
): Promise<void> {
  try {
    const scheduleId = typeof schedule === 'string' ? schedule : schedule.id;
    await stripe.subscriptionSchedules.release(scheduleId);

  } catch (error) {
    logger.error('Failed to release subscription schedule', error as Error, {
      metadata: {stripeSubscriptionId}
    })
    throw error
  }
}

/**
 * Synchronizes the database subscription record with the current Stripe subscription state.
 * This is the core function for keeping local subscription data in sync with Stripe,
 * handling plan changes, status updates, billing periods, and cancellation states.
 * 
 * @param subscriptionId - The Stripe subscription ID
 * @param customerId - The Stripe customer ID
 * @param status - The Stripe subscription status
 * @param currentPeriodStart - Unix timestamp of current billing period start
 * @param currentPeriodEnd - Unix timestamp of current billing period end
 * @param priceId - Optional Stripe price ID (for plan identification)
 * @param canceledAt - Optional Unix timestamp when subscription was cancelled
 * @param cancelAtPeriodEnd - Optional boolean indicating if cancellation is scheduled for period end
 * @param pendingPlanChange - Optional plan change scheduled for future
 * @param stripeScheduleId - Optional Stripe schedule ID for pending changes
 * @returns Promise<UserSubscription> - The updated subscription record
 * @throws Error if database synchronization fails
 */
export async function synchronizeSubscriptionWithStripe(
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
    // Only one subscription per customer
    const subscription = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!subscription) {
      logger.warn('No subscription found for customer', { metadata: { customerId } })
      return
    }

    const plan = priceId ? getPlanFromPriceId(priceId) : subscription.plan
    const stripeSubscriptionStatus = mapStripeStatusToSubscriptionStatus(status)

    const updateData: any = {
      stripeSubscriptionId: subscriptionId,
      plan: plan || subscription.plan,
      status: stripeSubscriptionStatus,
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
    if (stripeSubscriptionStatus === SubscriptionStatus.canceled && canceledAt) {
      updateData.canceledAt = new Date(canceledAt * 1000)
    }
    else if (stripeSubscriptionStatus === SubscriptionStatus.canceled &&
      !canceledAt && !subscription.canceledAt) {
      // Subscription is canceled but no timestamp from Stripe and no existing timestamp
      // This shouldn't happen in normal flow, but we'll set current time as fallback
      updateData.canceledAt = new Date()
      logger.warn('Subscription canceled without canceledAt timestamp', {
        metadata: {
          subscriptionId,
          customerId,
          status: stripeSubscriptionStatus
        }
      })
    } else if (stripeSubscriptionStatus !== SubscriptionStatus.canceled && subscription.canceledAt) {
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

    // Get plan limits from SUBSCRIPTION_PLANS when plan changes
    const planLimits = plan && plan !== subscription.plan ? SUBSCRIPTION_PLAN_DETAIL[plan] : null

    // Update plan limits if plan changed
    if (planLimits) {
      updateData.tokenLimit = planLimits.tokenLimit
    }

    const updatedSubscription = await SubscriptionOperations.updateSubscription(subscription.userId, updateData)

    logger.info('Updated subscription in database', {
      userId: subscription.userId,
      metadata: {
        subscriptionId,
        previousSubscriptionId: subscription.stripeSubscriptionId,
        newSubscriptionId: updatedSubscription.stripeSubscriptionId,
        subscriptionIdChanged: subscription.stripeSubscriptionId !== updatedSubscription.stripeSubscriptionId,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        tokenLimit: updatedSubscription.tokenLimit,
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
    logger.error('Failed to synchronize subscription in database', error as Error, {
      metadata: {
        subscriptionId,
        customerId,
      }
    })
    throw error
  }
}

/**
 * Schedules a subscription downgrade to take effect at the end of the current billing period.
 * This function creates a Stripe subscription schedule that maintains the current plan until
 * the billing period ends, then switches to the target plan. Handles existing schedules by
 * releasing them first to avoid conflicts.
 * 
 * @param stripeSubscriptionId - The current Stripe subscription ID
 * @param targetPriceId - The Stripe price ID for the target plan
 * @param userId - The user ID for database updates and logging
 * @param currentPlan - The current subscription plan
 * @param targetPlan - The target subscription plan for downgrade
 * @returns Promise<{effectiveDate: Date, message: string}> - Effective date and user message
 * @throws Error if schedule creation or database update fails
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
  logger.info('Starting downgrade scheduling process', {
    userId,
    metadata: {
      currentPlan,
      targetPlan,
      subscriptionId: stripeSubscriptionId
    }
  })
  
  // Get current subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  // Check if stripeSubscription is owned by a schedule, release it if true
  if (stripeSubscription.schedule) {
    logger.info('Found existing schedule, releasing it before creating new one', {
      userId,
      metadata: {
        subscriptionId: stripeSubscriptionId,
        currentPlan,
        targetPlan
      }
    })

    await releaseSubscriptionSchedule(stripeSubscription.schedule, stripeSubscriptionId)
  }
  
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