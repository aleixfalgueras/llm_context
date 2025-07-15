import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import { stripe } from '@/lib/payments/stripe'
import { STRIPE_PRICE_IDS } from '@/lib/payments/utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface UpgradePreviewResponse {
  currentPlan: SubscriptionPlan
  targetPlan: SubscriptionPlan
  currentPrice: number
  newPrice: number
  prorationAmount: number
  totalDue: number
  nextBillingDate: string
  currency: string
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId, billingInterval = 'monthly' } = await parseJsonBody(req)

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided for upgrade preview', { metadata: { planId } })
      throw new Error('Invalid plan ID')
    }

    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      logger.warn('Invalid billing interval provided for upgrade preview', { metadata: { billingInterval } })
      throw new Error('Invalid billing interval')
    }

    // Get current subscription
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!existingSubscription?.stripeSubscriptionId) {
      logger.warn('No active subscription found for upgrade preview - user appears to be in free trial', { 
        userId,
        metadata: {
          hasSubscriptionRecord: !!existingSubscription,
          planId: planId
        }
      })
      throw new Error('No active Stripe subscription found. This endpoint is for subscription upgrades only. Free trial users should proceed directly to checkout.')
    }

    // Get target price ID
    const targetPriceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan][billingInterval as 'monthly' | 'yearly']
    if (!targetPriceId) {
      logger.warn('No price ID found for plan in upgrade preview', { metadata: { planId, billingInterval } })
      throw new Error('Price not found')
    }

    try {
      // Get current subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripeSubscriptionId
      )

      // Get current and target prices (simplified - no proration)
      const currentPrice = await stripe.prices.retrieve(stripeSubscription.items.data[0].price.id)
      const targetPrice = await stripe.prices.retrieve(targetPriceId)

      // Simple pricing - just charge the new plan price
      const currentPriceAmount = currentPrice.unit_amount || 0
      const newPriceAmount = targetPrice.unit_amount || 0
      const totalDue = newPriceAmount // Simple: just charge the new plan price
      const prorationAmount = 0 // No proration - keep it simple

      // Get currentPeriodEnd from subscription items
      const subscriptionItem = stripeSubscription.items.data[0]
      const currentPeriodEnd = subscriptionItem.current_period_end

      const previewData: UpgradePreviewResponse = {
        currentPlan: existingSubscription.plan as SubscriptionPlan,
        targetPlan: planId as SubscriptionPlan,
        currentPrice: currentPriceAmount / 100, // Convert from cents
        newPrice: newPriceAmount / 100, // Convert from cents
        prorationAmount: prorationAmount / 100, // Convert from cents (always 0)
        totalDue: totalDue / 100, // Convert from cents (same as newPrice)
        nextBillingDate: new Date(currentPeriodEnd * 1000).toISOString(),
        currency: targetPrice.currency || 'eur'
      }

      logger.info('Upgrade preview calculated successfully', {
        userId,
        metadata: {
          currentPlan: existingSubscription.plan,
          targetPlan: planId,
          totalDue: previewData.totalDue,
          prorationAmount: previewData.prorationAmount
        }
      })

      return apiSuccess(previewData)
    } catch (error) {
      logger.error('Failed to calculate upgrade preview', error as Error, {
        userId,
        metadata: { planId, billingInterval }
      })
      throw error
    }
  },
  { 
    context: 'Preview subscription upgrade',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)