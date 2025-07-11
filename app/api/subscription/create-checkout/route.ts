import { clerkClient } from '@clerk/nextjs/server'
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/stripe-utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { logger } from '@/lib/logger'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api-middleware'

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

    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress

    if (!email) {
      logger.warn('No email found for user', { userId })
      throw new Error('User email not found')
    }

    const session = await createCheckoutSession(userId, email, priceId, planId)

    logger.info('Checkout session created successfully', { 
      userId, 
      metadata: {
        planId, 
        sessionId: session.id,
        billingInterval
      }
    })

    return apiSuccess({ url: session.url })
  },
  { 
    context: 'Create checkout session',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)