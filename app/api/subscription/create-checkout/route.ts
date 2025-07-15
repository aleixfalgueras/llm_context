import { clerkClient } from '@clerk/nextjs/server'
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/payments/utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { isDowngrade } from '@/lib/payments/subscription-utils'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/payments/stripe'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import Stripe from 'stripe'

interface CheckoutResponse {
  isDowngrade: boolean
  message?: string
  effectiveDate?: string
  url?: string | null
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId, billingInterval = 'monthly' } = await parseJsonBody(req)

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided', { metadata: { planId } })
      throw new Error('Invalid plan ID')
    }

    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      logger.warn('Invalid billing interval provided', { metadata: { billingInterval } })
      throw new Error('Invalid billing interval')
    }

    const priceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan][billingInterval as 'monthly' | 'yearly']
    if (!priceId) {
      logger.warn('No price ID found for plan', { metadata: { planId, billingInterval } })
      throw new Error('Price not found')
    }

    // Check if user has existing subscription and if this is a downgrade
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    // If user has active subscription and this is a downgrade, redirect to schedule-downgrade endpoint
    if (existingSubscription?.stripeSubscriptionId && 
        isDowngrade(existingSubscription.plan as SubscriptionPlan, planId as SubscriptionPlan)) {
      
      logger.info('Detected downgrade request, redirecting to schedule-downgrade API', {
        userId,
        metadata: {
          currentPlan: existingSubscription.plan,
          targetPlan: planId
        }
      })
      
      // Handle downgrade scheduling directly
      const targetPriceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan][billingInterval as 'monthly' | 'yearly']
      if (!targetPriceId) {
        logger.warn('No price ID found for plan in downgrade scheduling', { metadata: { planId, billingInterval } })
        throw new Error('Price not found')
      }

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

      const response: CheckoutResponse = {
        isDowngrade: true,
        message: `Downgrade scheduled successfully. Your plan will change to ${planId} on ${effectiveDate.toLocaleDateString()}.`,
        effectiveDate: effectiveDate.toISOString()
      }
      
      return apiSuccess(response)
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
        checkoutUrl: session.url,
        billingInterval
      }
    })

    const response: CheckoutResponse = {
      isDowngrade: false,
      url: session.url
    }
    
    return apiSuccess(response)
  },
  { 
    context: 'Create checkout session',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)