import {ApiContext, apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {stripe} from '@/lib/stripe/stripe'
import {getStripePriceId} from '@/lib/stripe/stripe-utils'
import {logger} from '@/lib/logger'
import {SubscriptionUsageOperations} from "@/database";
import {SubscriptionPlan, BillingInterval} from "@prisma/client";

interface UpgradePreviewResponse {
  currentPlan: SubscriptionPlan
  targetPlan: SubscriptionPlan
  currentPrice: number
  newPrice: number
  nextBillingDate: string
  currency: string
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId, billingInterval = BillingInterval.monthly } = await parseJsonBody(req)

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided for upgrade preview', { metadata: { planId } })
      throw new Error('Invalid plan ID')
    }

    // Get current subscription
    const existingSubscription = await SubscriptionUsageOperations.findByUserId(userId)

    if (!existingSubscription?.stripeSubscriptionId) {
      logger.warn('No active subscription found for upgrade/downgrade preview - ' +
        'user appears to be in free trial', {
        userId,
        metadata: {
          hasSubscriptionRecord: !!existingSubscription,
          planId: planId
        }
      })
      throw new Error('No active Stripe subscription found. ' +
        'This endpoint is for subscription upgrades/downgrade only. ' +
        'Free trial users should proceed directly to checkout.')
    }

    // Get target price ID based on billing interval
    const targetPriceId = getStripePriceId(planId as SubscriptionPlan, billingInterval)
    if (!targetPriceId) {
      logger.warn('No price ID found for plan in upgrade/downgrade preview', { metadata: { planId, billingInterval } })
      throw new Error('Price not found')
    }

    try {
      // Get current subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        existingSubscription.stripeSubscriptionId
      )

      // Get current and target prices
      const currentPrice = await stripe.prices.retrieve(stripeSubscription.items.data[0].price.id)
      const targetPrice = await stripe.prices.retrieve(targetPriceId)

      // Simple pricing - just charge the new plan price
      const currentPriceAmount = currentPrice.unit_amount || 0
      const newPriceAmount = targetPrice.unit_amount || 0

      // Get currentPeriodEnd from subscription items
      const subscriptionItem = stripeSubscription.items.data[0]
      const currentPeriodEnd = subscriptionItem.current_period_end

      const previewData: UpgradePreviewResponse = {
        currentPlan: existingSubscription.plan as SubscriptionPlan,
        targetPlan: planId as SubscriptionPlan,
        currentPrice: currentPriceAmount / 100, // Convert from cents
        newPrice: newPriceAmount / 100, // Convert from cents
        nextBillingDate: new Date(currentPeriodEnd * 1000).toISOString(),
        currency: targetPrice.currency || 'eur'
      }

      logger.info('Upgrade/downgrade preview calculated successfully', {
        userId,
        metadata: {
          currentPlan: existingSubscription.plan,
          targetPlan: planId,
          newPrice: previewData.newPrice
        }
      })

      return apiSuccess(previewData)
    } catch (error) {
      logger.error('Failed to calculate upgrade/downgrade preview', error as Error, {
        userId,
        metadata: { planId }
      })
      throw error
    }
  },
  { 
    context: 'Preview subscription upgrade/downgrade',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)