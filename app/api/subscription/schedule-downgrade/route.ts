import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import { stripe } from '@/lib/payments/stripe'
import { STRIPE_PRICE_IDS } from '@/lib/payments/utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { isDowngrade } from '@/lib/payments/subscription-utils'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface ScheduleDowngradeResponse {
  success: boolean
  message: string
  effectiveDate: string
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId, billingInterval = 'monthly' } = await parseJsonBody(req)

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided for downgrade scheduling', { metadata: { planId } })
      throw new Error('Invalid plan ID')
    }

    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      logger.warn('Invalid billing interval provided for downgrade scheduling', { metadata: { billingInterval } })
      throw new Error('Invalid billing interval')
    }

    // Get current subscription
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!existingSubscription?.stripeSubscriptionId) {
      logger.warn('No active subscription found for downgrade scheduling', { userId })
      throw new Error('No active subscription found')
    }

    // Verify this is actually a downgrade
    if (!isDowngrade(existingSubscription.plan as SubscriptionPlan, planId as SubscriptionPlan)) {
      logger.warn('Attempted to schedule downgrade for non-downgrade plan change', { 
        userId,
        metadata: { 
          currentPlan: existingSubscription.plan, 
          targetPlan: planId 
        } 
      })
      throw new Error('This is not a downgrade')
    }

    // Get target price ID
    const targetPriceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan][billingInterval as 'monthly' | 'yearly']
    if (!targetPriceId) {
      logger.warn('No price ID found for plan in downgrade scheduling', { metadata: { planId, billingInterval } })
      throw new Error('Price not found')
    }

    try {
      // Get current subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripeSubscriptionId
      )

      // Schedule the downgrade at the end of the current billing period
      const updatedSubscription = await stripe.subscriptions.update(
        existingSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: targetPriceId,
            },
          ],
          proration_behavior: 'none', // No immediate billing
          billing_cycle_anchor: 'unchanged', // Wait for next billing cycle
        }
      )

      // Get the effective date (next billing cycle)
      const subscriptionItem = updatedSubscription.items.data[0]
      const currentPeriodEnd = subscriptionItem.current_period_end
      const effectiveDate = new Date(currentPeriodEnd * 1000)

      logger.info('Downgrade scheduled successfully', {
        userId,
        metadata: {
          currentPlan: existingSubscription.plan,
          targetPlan: planId,
          subscriptionId: existingSubscription.stripeSubscriptionId,
          effectiveDate: effectiveDate.toISOString()
        }
      })

      const response: ScheduleDowngradeResponse = {
        success: true,
        message: `Downgrade scheduled successfully. Your plan will change to ${planId} on ${effectiveDate.toLocaleDateString()}.`,
        effectiveDate: effectiveDate.toISOString()
      }

      return apiSuccess(response)
    } catch (error) {
      logger.error('Failed to schedule downgrade', error as Error, {
        userId,
        metadata: { planId, billingInterval }
      })
      throw error
    }
  },
  { 
    context: 'Schedule subscription downgrade',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)