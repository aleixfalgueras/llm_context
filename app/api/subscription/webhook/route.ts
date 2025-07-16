import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/payments/stripe'
import { updateSubscriptionInDatabase, cancelSubscriptionImmediately } from '@/lib/payments/utils'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Idempotency check function
async function checkAndMarkEventProcessed(
  eventId: string, 
  eventType: string
): Promise<{ shouldSkip: boolean; isRetry: boolean }> {
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: eventId }
    })
    
    if (existing?.processed) {
      logger.info('Webhook event already processed', {
        metadata: { eventId, eventType, processedAt: existing.processedAt }
      })
      return { shouldSkip: true, isRetry: true }
    }
    
    if (existing && !existing.processed) {
      logger.info('Webhook event exists but not processed - retry', {
        metadata: { eventId, eventType, createdAt: existing.createdAt }
      })
      return { shouldSkip: false, isRetry: true }
    }
    
    // Create new record
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: eventId,
        eventType,
        processed: false
      }
    })
    
    logger.info('Created new webhook event record', {
      metadata: { eventId, eventType }
    })
    
    return { shouldSkip: false, isRetry: false }
  } catch (error) {
    logger.error('Error checking webhook event idempotency', error as Error, {
      metadata: { eventId, eventType }
    })
    throw error
  }
}

// Mark event as processed
async function markEventProcessed(eventId: string): Promise<void> {
  try {
    await prisma.webhookEvent.update({
      where: { stripeEventId: eventId },
      data: { 
        processed: true,
        processedAt: new Date()
      }
    })
    
    logger.info('Marked webhook event as processed', {
      metadata: { eventId }
    })
  } catch (error) {
    logger.error('Error marking webhook event as processed', error as Error, {
      metadata: { eventId }
    })
    throw error
  }
}

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

    // Check idempotency
    const { shouldSkip, isRetry } = await checkAndMarkEventProcessed(
      event.id, 
      event.type
    )
    
    if (shouldSkip) {
      logger.info('Skipping already processed webhook event', {
        metadata: { eventId: event.id, eventType: event.type }
      })
      return NextResponse.json({ received: true })
    }

    if (isRetry) {
      logger.info('Retrying webhook event processing', {
        metadata: { eventId: event.id, eventType: event.type }
      })
    }

    // Process the event
    await processWebhookEvent(event)
    
    // Mark as processed after successful completion
    await markEventProcessed(event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Webhook processing error', error as Error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Process webhook event based on type
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
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
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  try {
    const subscriptionItem = subscription.items.data[0]
    const priceId = subscriptionItem?.price?.id
    
    // Extract current period from subscription item
    const currentPeriodStart = subscriptionItem.current_period_start
    const currentPeriodEnd = subscriptionItem.current_period_end

    // Check if this is an upgrade (new subscription replacing an old one)
    const isUpgrade = subscription.metadata?.isUpgrade === 'true'
    const previousSubscriptionId = subscription.metadata?.previousSubscriptionId

    if (isUpgrade && previousSubscriptionId) {
      logger.info('Processing subscription upgrade', {
        metadata: {
          newSubscriptionId: subscription.id,
          previousSubscriptionId,
          customerId: subscription.customer
        }
      })

      // Immediately cancel the previous subscription to avoid double billing
      try {
        await cancelSubscriptionImmediately(previousSubscriptionId, 'upgraded')

        logger.info('Successfully canceled previous subscription during upgrade', {
          metadata: {
            previousSubscriptionId,
            newSubscriptionId: subscription.id,
            customerId: subscription.customer
          }
        })
      } catch (error) {
        // Enhanced error handling for upgrade cancellation failures
        if (error instanceof Error) {
          if (error.message.includes('No such subscription')) {
            logger.warn('Previous subscription not found in Stripe (may already be canceled)', {
              metadata: {
                previousSubscriptionId,
                newSubscriptionId: subscription.id,
                customerId: subscription.customer
              }
            })
          } else {
            logger.error('Failed to cancel previous subscription during upgrade', error, {
              metadata: {
                previousSubscriptionId,
                newSubscriptionId: subscription.id,
                customerId: subscription.customer,
                errorMessage: error.message
              }
            })
          }
        } else {
          logger.error('Unknown error canceling previous subscription during upgrade', new Error('Unknown error'), {
            metadata: {
              previousSubscriptionId,
              newSubscriptionId: subscription.id,
              customerId: subscription.customer
            }
          })
        }
        // Continue with the new subscription update even if old cancellation fails
      }
    }
    
    await updateSubscriptionInDatabase(
      subscription.id,
      subscription.customer as string,
      subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      priceId,
      subscription.canceled_at,
      subscription.cancel_at_period_end
    )

    logger.info('Subscription event processed successfully', {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
      currentPeriodEnd,
      undefined, // no priceId for deletion
      subscription.canceled_at,
      false // Set to false since subscription is now fully canceled
    )

    logger.info('Subscription deletion processed successfully', {
      metadata: {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        cancelAtPeriodEnd: false, // Always false for deleted subscriptions
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

