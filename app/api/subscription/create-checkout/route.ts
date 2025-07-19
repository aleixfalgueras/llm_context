import {clerkClient} from '@clerk/nextjs/server'
import {createCheckoutSession, STRIPE_PRICE_IDS} from '@/lib/stripe/stripe-utils'
import {SubscriptionPlan} from '@/types/subscription-types'
import {isDowngrade} from '@/lib/subscription/subscription-plan-utils'
import {scheduleSubscriptionDowngrade} from '@/lib/stripe/stripe-subscription'
import {logger} from '@/lib/logger'
import {ApiContext, apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/middleware/api-middleware'
import {SubscriptionOperations} from "@/lib/database";

interface CheckoutResponse {
  isDowngrade: boolean
  message?: string
  effectiveDate?: string
  url?: string | null
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId } = await parseJsonBody(req)

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided', { metadata: { planId } })
      throw new Error('Invalid plan ID')
    }

    const priceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan]
    if (!priceId) {
      logger.warn('No price ID found for plan', { metadata: { planId } })
      throw new Error('Price not found')
    }

    // Check if user has existing subscription
    const existingSubscription = await SubscriptionOperations.findByUserId(userId)

    // If user has active subscription and this is a downgrade, handle downgrade scheduling directly
    if (existingSubscription?.stripeSubscriptionId && 
        isDowngrade(existingSubscription.plan as SubscriptionPlan, planId as SubscriptionPlan)) {
      
      logger.info('Detected downgrade request, handling downgrade scheduling inline', {
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
        planId as SubscriptionPlan
      )

      const response: CheckoutResponse = {
        isDowngrade: true,
        message,
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
        checkoutUrl: session.url
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