import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@/lib/stripe-utils'
import { SubscriptionPlan } from '@/types/subscription-types'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized checkout attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, billingInterval = 'monthly' } = await request.json()

    if (!planId || !Object.values(SubscriptionPlan).includes(planId)) {
      logger.warn('Invalid plan ID provided', { metadata: { planId } })
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      logger.warn('Invalid billing interval provided', { metadata: { billingInterval } })
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 })
    }

    const priceId = STRIPE_PRICE_IDS[planId as SubscriptionPlan][billingInterval as 'monthly' | 'yearly']
    if (!priceId) {
      logger.warn('No price ID found for plan', { metadata: { planId, billingInterval } })
      return NextResponse.json({ error: 'Price not found' }, { status: 400 })
    }

    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress

    if (!email) {
      logger.warn('No email found for user', { userId })
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
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

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error('Failed to create checkout session', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}