import {NextRequest, NextResponse} from 'next/server'
import {headers} from 'next/headers'
import {stripe} from '@/lib/stripe/stripe'
import {logger} from '@/lib/logger'
import Stripe from 'stripe'
import {checkEventIdempotency, markEventProcessed, processWebhookEvent} from "@/lib/stripe/webhook-event";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
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
    const { shouldSkip, isRetry } = await checkEventIdempotency(
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


