import { stripe } from './stripe'
import { prisma } from '../prisma'
import { logger } from '../logger'
import { SubscriptionPlan, SubscriptionStatus } from '@/types/subscription-types'
import { invalidateSubscriptionCache } from './subscription-cache'
import Stripe from 'stripe'

export const STRIPE_PRICE_IDS = {
  [SubscriptionPlan.BASIC]: {
    monthly: process.env.STRIPE_BASIC_PRICE_ID || 'price_1RgN2fH1IwPXt7SI6fY3NRQF',
    yearly: process.env.STRIPE_BASIC_PRICE_ID_YEARLY || 'price_basic_yearly_to_be_created',
  },
  [SubscriptionPlan.PRO]: {
    monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_1RiV0KH1IwPXt7SIphwW0d6Z',
    yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY || 'price_pro_yearly_to_be_created',
  },
  [SubscriptionPlan.BUSINESS]: {
    monthly: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_1RiV0uH1IwPXt7SInp95Km4L',
    yearly: process.env.STRIPE_BUSINESS_PRICE_ID_YEARLY || 'price_business_yearly_to_be_created',
  },
} as const

export async function createOrRetrieveCustomer(userId: string, email: string) {
  try {
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (existingSubscription?.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId)
        if (customer && !customer.deleted) {
          return customer as Stripe.Customer
        }
      } catch (error) {
        logger.warn('Failed to retrieve existing Stripe customer', { 
          userId, 
          metadata: {
            stripeCustomerId: existingSubscription.stripeCustomerId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    })

    await prisma.userSubscription.upsert({
      where: { userId },
      update: { stripeCustomerId: customer.id },
      create: {
        userId,
        stripeCustomerId: customer.id,
        plan: SubscriptionPlan.BASIC,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        maxClients: 3,
        maxTokensPerMonth: 5000000,
      },
    })

    logger.info('Created new Stripe customer', { userId, metadata: { customerId: customer.id } })
    return customer
  } catch (error) {
    logger.error('Failed to create or retrieve customer', error as Error, { userId })
    throw error
  }
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  planId: SubscriptionPlan
) {
  try {
    const customer = await createOrRetrieveCustomer(userId, email)

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/subscription?canceled=true`,
    })

    logger.info('Created checkout session', { userId, metadata: { sessionId: session.id, planId } })
    return session
  } catch (error) {
    logger.error('Failed to create checkout session', error as Error, { userId, metadata: { planId } })
    throw error
  }
}

export async function createCustomerPortalSession(userId: string) {
  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found for user')
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/subscription`,
    })

    logger.info('Created customer portal session', { userId, metadata: { sessionId: portalSession.id } })
    return portalSession
  } catch (error) {
    if (error instanceof Error && error.message.includes('No Stripe customer found')) {
      // Don't log as ERROR for free trial users - this is expected behavior
      logger.debug('Customer portal session requested for user without Stripe customer', { userId })
    } else {
      logger.error('Failed to create customer portal session', error as Error, { userId })
    }
    throw error
  }
}

export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  for (const [plan, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return plan as SubscriptionPlan
    }
  }
  return null
}

export function mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE
    case 'canceled':
      return SubscriptionStatus.CANCELED
    case 'past_due':
      return SubscriptionStatus.PAST_DUE
    case 'incomplete':
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE
    default:
      return SubscriptionStatus.INCOMPLETE
  }
}

export async function updateSubscriptionInDatabase(
  subscriptionId: string,
  customerId: string,
  status: string,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  priceId?: string
) {
  try {
    const subscription = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!subscription) {
      logger.warn('No subscription found for customer', { metadata: { customerId } })
      return
    }

    const plan = priceId ? getPlanFromPriceId(priceId) : subscription.plan
    const subscriptionStatus = mapStripeStatusToSubscriptionStatus(status)

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        plan: plan || subscription.plan,
        status: subscriptionStatus,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        stripePriceId: priceId || subscription.stripePriceId,
        updatedAt: new Date(),
      },
    })

    logger.info('Updated subscription in database', {
      userId: subscription.userId,
      metadata: {
        subscriptionId,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
      }
    })

    // Invalidate subscription cache after successful update
    invalidateSubscriptionCache(subscription.userId)

    return updatedSubscription
  } catch (error) {
    logger.error('Failed to update subscription in database', error as Error, {
      metadata: {
        subscriptionId,
        customerId,
      }
    })
    throw error
  }
}