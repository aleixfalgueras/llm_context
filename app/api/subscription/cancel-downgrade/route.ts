import { 
  withEnhancedApi, 
  apiSuccess, 
  ApiContext 
} from '@/lib/middleware/api-middleware'
import { releaseSubscriptionSchedule } from '@/lib/payments/stripe-utils'
import { invalidateAllUserCaches } from '@/lib/payments/subscription-cache'

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    // Get current subscription to check for pending downgrade
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      select: {
        stripeScheduleId: true,
        pendingPlanChange: true,
        plan: true,
        stripeSubscriptionId: true
      }
    })

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

    try {
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

      // Invalidate all user caches after canceling downgrade
      await invalidateAllUserCaches(userId)

      return apiSuccess({
        message: 'Subscription downgrade canceled successfully',
        currentPlan: subscription.plan
      })
    } catch (error) {
      logger.error('Failed to cancel subscription downgrade', error as Error, {
        userId,
        metadata: {
          scheduleId: subscription.stripeScheduleId,
          pendingPlan: subscription.pendingPlanChange
        }
      })
      throw error
    }
  },
  { 
    context: 'Cancel subscription downgrade',
    allowedMethods: ['POST']
  }
)