import {prisma} from "@/lib/prisma";
import {logger} from "@/lib/logger";
import Stripe from "stripe";
import {
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleSubscriptionDeleted,
  handleSubscriptionEvent
} from "@/lib/stripe/webhook-handle";

export async function checkEventIdempotency(
  eventId: string,
  eventType: string
): Promise<{ shouldSkip: boolean; isRetry: boolean }> {
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: {stripeEventId: eventId}
    })

    if (existing?.processed) {
      logger.info('Webhook event already processed', {
        metadata: {eventId, eventType, processedAt: existing.processedAt}
      })
      return {shouldSkip: true, isRetry: true}
    }

    if (existing && !existing.processed) {
      logger.info('Webhook event exists but not processed - retry', {
        metadata: {eventId, eventType, createdAt: existing.createdAt}
      })
      return {shouldSkip: false, isRetry: true}
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
      metadata: {eventId, eventType}
    })

    return {shouldSkip: false, isRetry: false}
  } catch (error) {
    logger.error('Error checking webhook event idempotency', error as Error, {
      metadata: {eventId, eventType}
    })
    throw error
  }
}

// Process webhook event based on type
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
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
      logger.info('Unhandled webhook event type', {metadata: {type: event.type}})
  }
}

// Mark event as processed
export async function markEventProcessed(eventId: string): Promise<void> {
  try {
    await prisma.webhookEvent.update({
      where: {stripeEventId: eventId},
      data: {
        processed: true,
        processedAt: new Date()
      }
    })

    logger.info('Marked webhook event as processed', {
      metadata: {eventId}
    })
  } catch (error) {
    logger.error('Error marking webhook event as processed', error as Error, {
      metadata: {eventId}
    })
    throw error
  }
}
