import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { invalidateSubscriptionCache } from '@/lib/subscription-cache'
import Stripe from 'stripe'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/middleware/api-middleware'

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription?.stripeSubscriptionId) {
      logger.warn('No active subscription found for cancellation', { userId })
      const error = new Error('No active subscription found')
      ;(error as any).status = 404
      throw error
    }

    try {
      // Cancel the subscription at the end of the current period
      const canceledSubscription: Stripe.Subscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      )

      // Update the subscription in the database
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Invalidate subscription cache after successful cancellation
      invalidateSubscriptionCache(userId)

      logger.info('Subscription canceled successfully', {
        userId,
        metadata: {
          subscriptionId: subscription.stripeSubscriptionId,
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        }
      })

      return apiSuccess({
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period',
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      })
    } catch (error) {
      // Handle Stripe-specific errors
      if (error instanceof Error && error.message.includes('No such subscription')) {
        const notFoundError = new Error('Subscription not found')
        ;(notFoundError as any).status = 404
        throw notFoundError
      }
      throw error
    }
  },
  { 
    context: 'Cancel subscription',
    allowedMethods: ['POST']
  }
)