import { clerkClient } from '@clerk/nextjs/server'
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/payments/utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { logger } from '@/lib/logger'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import Stripe from 'stripe'

// Define the response interface for type safety
interface CheckoutResponse {
  url?: string | null
  success?: boolean
  subscriptionId?: string
  status?: Stripe.Subscription.Status
}

export const POST = withEnhancedApi<CheckoutResponse>(
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

    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress

    if (!email) {
      logger.warn('No email found for user', { userId })
      throw new Error('User email not found')
    }

    const session = await createCheckoutSession(userId, email, priceId, planId)

    // Handle different return types from createCheckoutSession
    if ('url' in session) {
      // New customer - checkout session created
      logger.info('Checkout session created successfully', { 
        userId, 
        metadata: {
          planId, 
          checkoutUrl: session.url,
          billingInterval
        }
      })
      return apiSuccess<CheckoutResponse>({ 
        url: session.url
      })
    } else {
      // Existing customer - subscription updated directly
      logger.info('Subscription updated successfully', { 
        userId, 
        metadata: {
          planId, 
          subscriptionId: session.subscriptionId,
          status: session.status,
          billingInterval
        }
      })
      return apiSuccess<CheckoutResponse>({ 
        success: true, 
        subscriptionId: session.subscriptionId, 
        status: session.status 
      })
    }
  },
  { 
    context: 'Create checkout session',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)