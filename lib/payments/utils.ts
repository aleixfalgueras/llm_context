import {stripe} from './stripe'
import {prisma} from '../prisma'
import {logger} from '../logger'
import {SubscriptionPlan, SubscriptionStatus} from '@/types/subscription-types'
import {invalidateAllUserCaches} from './subscription-cache'
import {SUBSCRIPTION_PLANS} from './subscription-utils'
import Stripe from 'stripe'

export const STRIPE_PRICE_IDS = {
  [SubscriptionPlan.BASIC]: process.env.STRIPE_BASIC_PRICE_ID || 'price_1RgN2fH1IwPXt7SI6fY3NRQF',
  [SubscriptionPlan.PRO]: process.env.STRIPE_PRO_PRICE_ID || 'price_1RiV0KH1IwPXt7SIphwW0d6Z',
  [SubscriptionPlan.BUSINESS]: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_1RiV0uH1IwPXt7SInp95Km4L',
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
        maxClients: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxClients,
        maxTokensPerMonth: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxTokensPerMonth,
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

    // Check if customer has existing active subscription
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

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
  for (const [plan, planPriceId] of Object.entries(STRIPE_PRICE_IDS)) {
    if (planPriceId === priceId) {
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

    // Get plan limits from SUBSCRIPTION_PLANS when plan changes
    const planLimits = plan && plan !== subscription.plan ? SUBSCRIPTION_PLANS[plan] : null

    const updateData: any = {
      stripeSubscriptionId: subscriptionId,
      plan: plan || subscription.plan,
      status: subscriptionStatus,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      stripePriceId: priceId || subscription.stripePriceId,
      updatedAt: new Date(),
    }

    // Update plan limits if plan changed
    if (planLimits) {
      updateData.maxClients = planLimits.maxClients
      updateData.maxTokensPerMonth = planLimits.maxTokensPerMonth
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: subscription.id },
      data: updateData,
    })

    logger.info('Updated subscription in database', {
      userId: subscription.userId,
      metadata: {
        subscriptionId,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        maxClients: updatedSubscription.maxClients,
        maxTokensPerMonth: updatedSubscription.maxTokensPerMonth,
        planLimitsUpdated: !!planLimits
      }
    })

    // Invalidate all user caches after successful update
    await invalidateAllUserCaches(subscription.userId)

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