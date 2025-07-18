import {prisma} from "@/lib/prisma";
import {logger} from "@/lib/logger";

export async function checkAndMarkEventProcessed(
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