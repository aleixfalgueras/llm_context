import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/payments/stripe'
import { updateSubscriptionInDatabase } from '@/lib/payments/utils'
import { logger } from '@/lib/logger'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      logger.warn('No Stripe signature found in webhook request')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      logger.error('Invalid webhook signature', error as Error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    logger.info('Received Stripe webhook event', { 
      metadata: {
        type: event.type, 
        id: event.id 
      }
    })

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionEvent(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        logger.info('Unhandled webhook event type', { metadata: { type: event.type } })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook processing error', error as Error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const subscriptionItem = subscription.items.data[0]
    const priceId = subscriptionItem?.price?.id
    
    // Extract current period from subscription item
    const currentPeriodStart = subscriptionItem.current_period_start
    const currentPeriodEnd = subscriptionItem.current_period_end
    
    await updateSubscriptionInDatabase(
      subscription.id,
      subscription.customer as string,
      subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      priceId
    )

    logger.info('Subscription event processed successfully', {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
      }
    })
  } catch (error) {
    logger.error('Failed to handle subscription event', error as Error, {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      }
    })
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionItem = subscription.items.data[0]
    
    // Extract current period from subscription item
    const currentPeriodStart = subscriptionItem.current_period_start
    const currentPeriodEnd = subscriptionItem.current_period_end
    
    await updateSubscriptionInDatabase(
      subscription.id,
      subscription.customer as string,
      'canceled',
      currentPeriodStart,
      currentPeriodEnd
    )

    logger.info('Subscription deletion processed successfully', {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      }
    })
  } catch (error) {
    logger.error('Failed to handle subscription deletion', error as Error, {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      }
    })
    throw error
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.parent?.subscription_details?.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.parent.subscription_details.subscription as string)
      await handleSubscriptionEvent(subscription)
    }

    logger.info('Invoice payment succeeded', {
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.parent?.subscription_details?.subscription,
      }
    })
  } catch (error) {
    logger.error('Failed to handle invoice payment succeeded', error as Error, {
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      }
    })
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.parent?.subscription_details?.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.parent.subscription_details.subscription as string)
      await handleSubscriptionEvent(subscription)
    }

    logger.warn('Invoice payment failed', {
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId: invoice.parent?.subscription_details?.subscription,
      }
    })
  } catch (error) {
    logger.error('Failed to handle invoice payment failed', error as Error, {
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      }
    })
    throw error
  }
}

