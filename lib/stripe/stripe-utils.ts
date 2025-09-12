import {stripe} from './stripe'
import {logger} from '../logger'
import {SubscriptionUsageOperations} from '@/database'
import Stripe from 'stripe'
import {SubscriptionService} from "@/services/subscription/subscription-service";
import { SubscriptionPlan, BillingInterval } from '@prisma/client';

// Monthly price IDs
export const STRIPE_MONTHLY_PRICE_IDS = {
  [SubscriptionPlan.apprentice]: process.env.STRIPE_APPRENTICE_PRICE_ID || 'price_apprentice_placeholder',
  [SubscriptionPlan.knight]: process.env.STRIPE_KNIGHT_PRICE_ID || 'price_knight_placeholder',
  [SubscriptionPlan.master]: process.env.STRIPE_MASTER_PRICE_ID || 'price_master_placeholder',
  [SubscriptionPlan.jedi]: process.env.STRIPE_JEDI_PRICE_ID || 'price_jedi_placeholder',
} as const

// Annual price IDs (with 20% discount)
export const STRIPE_ANNUAL_PRICE_IDS = {
  [SubscriptionPlan.apprentice]: process.env.STRIPE_APPRENTICE_ANNUAL_PRICE_ID || 'price_apprentice_annual_placeholder',
  [SubscriptionPlan.knight]: process.env.STRIPE_KNIGHT_ANNUAL_PRICE_ID || 'price_knight_annual_placeholder',
  [SubscriptionPlan.master]: process.env.STRIPE_MASTER_ANNUAL_PRICE_ID || 'price_master_annual_placeholder',
  [SubscriptionPlan.jedi]: process.env.STRIPE_JEDI_ANNUAL_PRICE_ID || 'price_jedi_annual_placeholder',
} as const

// Helper to get the correct price ID based on billing interval
export function getStripePriceId(plan: SubscriptionPlan, interval: BillingInterval = BillingInterval.monthly): string {
  return interval === BillingInterval.annual 
    ? STRIPE_ANNUAL_PRICE_IDS[plan] 
    : STRIPE_MONTHLY_PRICE_IDS[plan];
}

/**
 * Creates a new Stripe customer or retrieves an existing one for the given user.
 * If the user already has a subscription with a valid Stripe customer ID, it will attempt
 * to retrieve that customer. If the customer doesn't exist or is deleted, a new customer is created.
 * 
 * @param userId - The unique identifier for the user
 * @param email - The email address for the customer
 * @returns Promise<Stripe.Customer> - The Stripe customer object
 * @throws Error if customer creation/retrieval fails
 */
export async function createOrRetrieveCustomer(userId: string, email: string) {
  try {
    const existingSubscription = await SubscriptionUsageOperations.findByUserId(userId)

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

    await SubscriptionService.updateSubscription(userId, { 
      stripeCustomerId: customer.id,
      email 
    })

    logger.info('Created new Stripe customer', { userId, metadata: { customerId: customer.id } })
    return customer
  } catch (error) {
    logger.error('Failed to create or retrieve customer', error as Error, { userId })
    throw error
  }
}

/**
 * Creates a Stripe checkout session for subscription purchase or upgrade.
 * Handles both new subscriptions and upgrades from existing subscriptions.
 * For upgrades, the old subscription will be cancelled after the new one is created using metada.
 * 
 * @param userId - The unique identifier for the user
 * @param email - The email address for the customer
 * @param priceId - The Stripe price ID for the subscription plan
 * @param planId - The subscription plan type being purchased
 * @param billingInterval - The billing interval (monthly or annual)
 * @returns Promise<{success: boolean, url: string | null}> - Success status and checkout URL
 * @throws Error if checkout session creation fails
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  planId: SubscriptionPlan,
  billingInterval: BillingInterval = BillingInterval.monthly
) {
  try {
    const customer = await createOrRetrieveCustomer(userId, email)

    // Check if customer has existing active subscription
    const existingSubscription = await SubscriptionUsageOperations.findByUserId(userId)

    const isUpgrade = existingSubscription?.stripeSubscriptionId && SubscriptionService.isSubscriptionActive(existingSubscription)
    
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
        billingInterval,
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

/**
 * Creates a Stripe customer portal session for subscription management.
 * Allows customers to view invoices, update payment methods, and manage their subscription.
 * 
 * @param userId - The unique identifier for the user
 * @returns Promise<Stripe.BillingPortal.Session> - The billing portal session object
 * @throws Error if the user doesn't have a Stripe customer ID or portal creation fails
 */
export async function createCustomerPortalSession(userId: string) {
  try {
    const subscription = await SubscriptionUsageOperations.findByUserId(userId)

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
    throw error
  }
}

/**
 * Maps a Stripe price ID to the corresponding subscription plan and billing interval.
 * Used to identify which plan and interval a customer is subscribing to based on the price ID.
 * 
 * @param priceId - The Stripe price ID to look up
 * @returns {plan: SubscriptionPlan, interval: BillingInterval} | null - The plan and interval or null if not found
 */
export function getPlanFromPriceId(priceId: string): { plan: SubscriptionPlan; interval: BillingInterval } | null {
  // Check monthly prices
  for (const [plan, planPriceId] of Object.entries(STRIPE_MONTHLY_PRICE_IDS)) {
    if (planPriceId === priceId) {
      return { plan: plan as SubscriptionPlan, interval: BillingInterval.monthly }
    }
  }
  
  // Check annual prices
  for (const [plan, planPriceId] of Object.entries(STRIPE_ANNUAL_PRICE_IDS)) {
    if (planPriceId === priceId) {
      return { plan: plan as SubscriptionPlan, interval: BillingInterval.annual }
    }
  }
  
  return null
}
