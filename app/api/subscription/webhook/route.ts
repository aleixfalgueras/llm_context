import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/payments/stripe'
import { cancelSubscriptionImmediately } from '@/lib/payments/stripe-utils'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import {SubscriptionOperations} from "@/lib/database";

// Helper function to check if a subscription is part of an upgrade flow
async function isUpgradeSubscription(subscriptionId: string, customerId: string): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return subscription.metadata?.isUpgrade === 'true'
  } catch (error) {
    logger.warn('Failed to check upgrade status for subscription', {
      metadata: {
        subscriptionId,
        customerId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return false
  }
}

// Helper function to validate upgrade state
async function validateUpgradeState(
  newSubscriptionId: string, 
  previousSubscriptionId: string, 
  customerId: string
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // Check if previous subscription exists in database
    const previousSub = await prisma.userSubscription.findFirst({
      where: { 
        stripeCustomerId: customerId,
        stripeSubscriptionId: previousSubscriptionId
      }
    })

    if (!previousSub) {
      return { isValid: false, reason: 'Previous subscription not found in database' }
    }

    // Check if new subscription already exists (race condition protection)
    const newSub = await prisma.userSubscription.findFirst({
      where: { 
        stripeCustomerId: customerId,
        stripeSubscriptionId: newSubscriptionId
      }
    })

    if (newSub) {
      return { isValid: false, reason: 'New subscription already exists in database' }
    }

    // Additional defensive check: verify previous subscription is still active
    // If it's already cancelled, this upgrade may have been processed already
    if (previousSub.status === 'canceled') {
      return { isValid: false, reason: 'Previous subscription already cancelled - upgrade likely already processed' }
    }

    // Check if current database subscription is already the new one
    const currentSub = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      orderBy: { updatedAt: 'desc' }
    })

    if (currentSub && currentSub.stripeSubscriptionId === newSubscriptionId) {
      return { isValid: false, reason: 'Upgrade already completed - current subscription matches new subscription' }
    }

    return { isValid: true }
  } catch (error) {
    logger.error('Failed to validate upgrade state', error as Error, {
      metadata: {
        newSubscriptionId,
        previousSubscriptionId,
        customerId
      }
    })
    return { isValid: false, reason: 'Database validation failed' }
  }
}

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
      await handleSubscriptionEvent(subscription, event.type)
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

// Handle upgrade process atomically - Single source of truth for upgrades
async function handleUpgradeProcess(
  newSubscription: Stripe.Subscription,
  previousSubscriptionId: string
): Promise<void> {
  const subscriptionItem = newSubscription.items.data[0]
  const priceId = subscriptionItem?.price?.id
  const currentPeriodStart = subscriptionItem.current_period_start
  const currentPeriodEnd = subscriptionItem.current_period_end

  try {
    logger.info('Starting upgrade process - Single source of truth', {
      metadata: {
        newSubscriptionId: newSubscription.id,
        previousSubscriptionId,
        customerId: newSubscription.customer,
        newSubscriptionStatus: newSubscription.status,
        newSubscriptionPriceId: priceId,
        newSubscriptionCanceledAt: newSubscription.canceled_at,
        newSubscriptionCancelAtPeriodEnd: newSubscription.cancel_at_period_end
      }
    })

    // Step 1: Validate upgrade state to prevent race conditions
    const validation = await validateUpgradeState(
      newSubscription.id,
      previousSubscriptionId,
      newSubscription.customer as string
    )

    if (!validation.isValid) {
      logger.warn('Upgrade validation failed - skipping upgrade process', {
        metadata: {
          newSubscriptionId: newSubscription.id,
          previousSubscriptionId,
          customerId: newSubscription.customer,
          reason: validation.reason
        }
      })
      
      // If the new subscription already exists, this is likely a duplicate event
      if (validation.reason === 'New subscription already exists in database') {
        logger.info('Duplicate upgrade event detected - upgrade already processed')
        return
      }
      
      // For other validation failures, continue with upgrade anyway but log the issue
      logger.warn('Continuing with upgrade despite validation failure')
    }

    // Step 2: Cancel old subscription first
    await cancelSubscriptionImmediately(previousSubscriptionId, 'upgraded')

    logger.info('Old subscription cancelled, updating database', {
      metadata: {
        newSubscriptionId: newSubscription.id,
        previousSubscriptionId,
        customerId: newSubscription.customer
      }
    })

    // Step 3: Update database only after successful cancellation
    // This is the single source of truth - no other webhook event should modify during upgrade
    await SubscriptionOperations.updateSubscriptionInDatabase(
      newSubscription.id,
      newSubscription.customer as string,
      newSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      priceId,
      null, // Explicitly clear canceledAt for upgrade to active subscription
      newSubscription.cancel_at_period_end,
      null, // Clear any pending plan change since this is an immediate upgrade
      null // Clear schedule ID since upgrade replaces any pending scheduled changes
    )

    // Step 4: Clear upgrade metadata to prevent future confusion
    try {
      await stripe.subscriptions.update(newSubscription.id, {
        metadata: {
          // Remove upgrade-specific metadata
          isUpgrade: '',
          previousSubscriptionId: '',
          // Preserve other metadata if any (you can extend this as needed)
        }
      })
      
      logger.info('Upgrade metadata cleared successfully', {
        metadata: {
          subscriptionId: newSubscription.id,
          customerId: newSubscription.customer
        }
      })
    } catch (metadataError) {
      // Non-critical error - log but don't fail the upgrade
      logger.warn('Failed to clear upgrade metadata (non-critical)', {
        metadata: {
          subscriptionId: newSubscription.id,
          customerId: newSubscription.customer,
          error: metadataError instanceof Error ? metadataError.message : 'Unknown error'
        }
      })
    }

    logger.info('Upgrade completed successfully - Database updated', {
      metadata: {
        newSubscriptionId: newSubscription.id,
        previousSubscriptionId,
        customerId: newSubscription.customer,
        finalStatus: newSubscription.status,
        priceId: priceId,
        canceledAtCleared: true,
        cancelAtPeriodEnd: newSubscription.cancel_at_period_end,
        metadataCleared: true
      }
    })
  } catch (error) {
    logger.error('Upgrade failed - will retry on next webhook', error as Error, {
      metadata: {
        newSubscriptionId: newSubscription.id,
        previousSubscriptionId,
        customerId: newSubscription.customer
      }
    })
    throw error // Re-throw to ensure webhook is not marked as processed
  }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  try {
    // Only allow upgrades for 'created' events - 'updated' events should be regular updates
    const isUpgrade = eventType === 'customer.subscription.created' && 
                     subscription.metadata?.isUpgrade === 'true'
    const previousSubscriptionId = subscription.metadata?.previousSubscriptionId

    if (isUpgrade && previousSubscriptionId) {
      logger.info('Processing subscription upgrade', {
        metadata: {
          subscriptionId: subscription.id,
          eventType,
          previousSubscriptionId,
          customerId: subscription.customer
        }
      })
      // Handle upgrade process atomically
      await handleUpgradeProcess(subscription, previousSubscriptionId)
    } else {
      // Log the reason for not treating as upgrade
      if (subscription.metadata?.isUpgrade === 'true' && eventType === 'customer.subscription.updated') {
        logger.info('Subscription has upgrade metadata but processing as regular update due to event type', {
          metadata: {
            subscriptionId: subscription.id,
            eventType,
            customerId: subscription.customer,
            reason: 'updated_event_not_upgrade'
          }
        })
      }
      // Handle regular subscription event
      const subscriptionItem = subscription.items.data[0]
      const priceId = subscriptionItem?.price?.id
      const currentPeriodStart = subscriptionItem.current_period_start
      const currentPeriodEnd = subscriptionItem.current_period_end

      // Check if this is a pending plan change taking effect
      const dbSubscription = await prisma.userSubscription.findFirst({
        where: { stripeCustomerId: subscription.customer as string }
      })

      let pendingPlanChangeValue = dbSubscription?.pendingPlanChange || null
      let clearScheduleId = false
      
      if (dbSubscription?.pendingPlanChange && priceId) {
        const { getPlanFromPriceId } = await import('@/lib/payments/stripe-utils')
        const newPlan = getPlanFromPriceId(priceId)
        
        // If the new plan matches the pending plan change, clear the pending change
        if (newPlan === dbSubscription.pendingPlanChange) {
          pendingPlanChangeValue = null
          clearScheduleId = true // Also clear schedule ID when plan change completes
          logger.info('Pending plan change applied, clearing pendingPlanChange', {
            metadata: {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              previousPendingPlan: dbSubscription.pendingPlanChange,
              newPlan,
              scheduleCompleted: !!dbSubscription.stripeScheduleId
            }
          })
        }
      }

      await SubscriptionOperations.updateSubscriptionInDatabase(
        subscription.id,
        subscription.customer as string,
        subscription.status,
        currentPeriodStart,
        currentPeriodEnd,
        priceId,
        subscription.canceled_at,
        subscription.cancel_at_period_end,
        pendingPlanChangeValue,
        clearScheduleId ? null : undefined
      )


      logger.info('Subscription event processed successfully', {
        metadata: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          eventType,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: priceId,
          processedAs: 'regular_subscription_update',
          scheduleCompleted: clearScheduleId
        }
      })
    }
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
    // Check if this subscription was deleted as part of an upgrade
    // In that case, skip processing as it's handled by the upgrade flow
    const dbSubscription = await prisma.userSubscription.findFirst({
      where: { 
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id 
      }
    })
    
    // If the subscription is not found in our database, it might have been replaced during upgrade
    if (!dbSubscription) {
      logger.info('Subscription not found in database - likely replaced during upgrade', {
        metadata: {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        }
      })
      return
    }

    // Check if there's a newer subscription for this customer (indicating upgrade)
    const currentSubscription = await prisma.userSubscription.findFirst({
      where: { 
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: { not: subscription.id }
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (currentSubscription && currentSubscription.updatedAt > dbSubscription.updatedAt) {
      logger.info('Skipping subscription deletion - newer subscription exists (upgrade scenario)', {
        metadata: {
          deletedSubscriptionId: subscription.id,
          currentSubscriptionId: currentSubscription.stripeSubscriptionId,
          customerId: subscription.customer,
        }
      })
      return
    }

    const subscriptionItem = subscription.items.data[0]

    // Extract current period from subscription item
    const currentPeriodStart = subscriptionItem.current_period_start
    const currentPeriodEnd = subscriptionItem.current_period_end
    
    await SubscriptionOperations.updateSubscriptionInDatabase(
      subscription.id,
      subscription.customer as string,
      'canceled',
      currentPeriodStart,
      currentPeriodEnd,
      undefined, // no priceId for deletion
      subscription.canceled_at,
      false, // Set to false since subscription is now fully canceled
      null, // Clear pending plan change since subscription is deleted
      null // Clear schedule ID since subscription is deleted
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
      
      // Skip processing if this is part of an upgrade flow
      // The upgrade will be handled by customer.subscription.created event
      if (subscription.metadata?.isUpgrade === 'true') {
        logger.info('Skipping invoice payment processing for upgrade - will be handled by subscription.created', {
          metadata: {
            invoiceId: invoice.id,
            subscriptionId: subscription.id,
            customerId: invoice.customer,
            isUpgrade: true,
            previousSubscriptionId: subscription.metadata?.previousSubscriptionId
          }
        })
        return
      }
      
      await handleSubscriptionEvent(subscription, 'invoice.payment_succeeded')
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
      await handleSubscriptionEvent(subscription, 'invoice.payment_failed')
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


