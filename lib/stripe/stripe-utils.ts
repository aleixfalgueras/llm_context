import {stripe} from './stripe'
import {logger} from '../logger'
import {SubscriptionPlan} from '@/types/subscription-types'
import {SubscriptionOperations} from '@/lib/database'
import Stripe from 'stripe'

export const STRIPE_PRICE_IDS = {
  [SubscriptionPlan.BASIC]: process.env.STRIPE_BASIC_PRICE_ID || 'price_1RgN2fH1IwPXt7SI6fY3NRQF',
  [SubscriptionPlan.PRO]: process.env.STRIPE_PRO_PRICE_ID || 'price_1RiV0KH1IwPXt7SIphwW0d6Z',
  [SubscriptionPlan.BUSINESS]: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_1RiV0uH1IwPXt7SInp95Km4L',
} as const

export async function createOrRetrieveCustomer(userId: string, email: string) {
  try {
    const existingSubscription = await SubscriptionOperations.findByUserId(userId)

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

    await SubscriptionOperations.updateSubscription(userId, { stripeCustomerId: customer.id })

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

    // Check if customer has existing active subscription
    const existingSubscription = await SubscriptionOperations.findByUserId(userId)

    const isUpgrade = existingSubscription?.stripeSubscriptionId
    
    logger.info(isUpgrade ? 'Creating checkout session for subscription upgrade' : 'Creating checkout session for new customer', { 
      userId, 
      metadata: { 
        planId,
        isUpgrade,
        existingSubscriptionId: existingSubscription?.stripeSubscriptionId 
      } 
    })
    
    // Configure checkout session based on whether it's an upgrade or new subscription
    const checkoutConfig: any = {
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/subscription?canceled=true`,
    }

    // Configure metadata for both new subscriptions and upgrades
    checkoutConfig.subscription_data = {
      metadata: {
        userId,
        planId,
        ...(isUpgrade && existingSubscription?.stripeSubscriptionId && {
          isUpgrade: 'true',
          previousSubscriptionId: existingSubscription.stripeSubscriptionId
        })
      },
    }

    // For upgrades, we'll handle the old subscription cancellation in the webhook
    // after the new subscription is successfully created
    const session = await stripe.checkout.sessions.create(checkoutConfig)

    logger.info(isUpgrade ? 'Created checkout session for subscription upgrade' : 'Created checkout session for new customer', { 
      userId, 
      metadata: { 
        sessionId: session.id, 
        planId,
        isUpgrade
      } 
    })
    return { success: true, url: session.url }
  } catch (error) {
    logger.error('Failed to create checkout session', error as Error, { userId, metadata: { planId } })
    throw error
  }
}

export async function createCustomerPortalSession(userId: string) {
  try {
    const subscription = await SubscriptionOperations.findByUserId(userId)

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
    logger.error('Failed to create customer portal session', error as Error, { userId })
    throw error
  }
}

export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  for (const [plan, planPriceId] of Object.entries(STRIPE_PRICE_IDS)) {
    if (planPriceId === priceId) {
      return plan as SubscriptionPlan
    }
  }
  return null
}
