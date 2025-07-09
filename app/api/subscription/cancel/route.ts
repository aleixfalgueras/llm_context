import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { invalidateSubscriptionCache } from '@/lib/subscription-cache'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized subscription cancel attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription?.stripeSubscriptionId) {
      logger.warn('No active subscription found for cancellation', { userId })
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

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

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
    })
  } catch (error) {
    logger.error('Failed to cancel subscription', error as Error, { userId: (await auth()).userId ?? undefined })
    
    if (error instanceof Error && error.message.includes('No such subscription')) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}