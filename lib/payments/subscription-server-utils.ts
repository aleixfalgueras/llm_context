import { stripe } from './stripe'
import { logger } from '../logger'
import { SubscriptionPlan } from '@/types/subscription-types'
import { releaseSubscriptionSchedule } from "./stripe-utils"
import { prisma } from '../prisma'
import { invalidateAllUserCaches } from './subscription-cache'

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