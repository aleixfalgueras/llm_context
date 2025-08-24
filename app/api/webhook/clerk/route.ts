import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { AffiliationService } from '@/services/affiliation-service'
import { SubscriptionService } from '@/services/subscription/subscription-service'
import { SubscriptionUsageService } from '@/services/subscription/subscription-usage-service'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    logger.error('Error verifying webhook', err as Error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, unsafe_metadata, first_name, last_name, email_addresses } = evt.data
    
    try {
      // Extract referral code from unsafe metadata if it exists
      const referralCode = unsafe_metadata?.referralCode as string | undefined
      let affiliationCode: string | undefined
      
      // Only create affiliations for users who signed up with a referral code
      if (referralCode) {
        // Build public name from available data
        let publicName: string
        if (first_name && last_name) {
          publicName = `${first_name} ${last_name}`
        } else if (first_name) {
          publicName = first_name
        } else if (email_addresses && email_addresses.length > 0) {
          publicName = email_addresses[0].email_address
        } else {
          publicName = 'Anonymous'
        }
        
        // Create affiliation for users who signed up through a referral link
        const result = await AffiliationService.getOrCreateUserAffiliationCode(
          id,
          referralCode,
          publicName
        )
        
        affiliationCode = result.affiliationCode
        logger.info(`Webhook: Created affiliation for new user ${id} - code: ${result.affiliationCode}, parent: ${referralCode}, isNew: ${result.isNew}`)
      } else {
        // User signed up without referral code - no affiliation created
        // They can manually create one later if they choose to join a network
        logger.info(`Webhook: User ${id} signed up without referral code - no affiliation created`)
      }
      
      // Create default subscription and usage records for the new user
      try {
        // Create subscription first
        const subscription = await SubscriptionService.createDefaultSubscription(id)
        logger.info(`Webhook: Created default subscription for user ${id}`, {
          metadata: {
            plan: subscription.plan,
            periodEnd: subscription.currentPeriodEnd?.toISOString()
          }
        })
        
        // Then create usage record for the current billing period
        const usage = await SubscriptionUsageService.createDefaultUsage(id)
        logger.info(`Webhook: Created default usage record for user ${id}`, {
          metadata: {
            billingPeriodStart: usage.billingPeriodStart.toISOString(),
            billingPeriodEnd: usage.billingPeriodEnd.toISOString()
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          affiliationCode,
          subscription: {
            plan: subscription.plan,
            status: subscription.status
          },
          usage: {
            tokensUsed: usage.tokensUsed
          }
        })
      } catch (subscriptionError) {
        // Log the error but don't fail the webhook
        logger.error(`Webhook: Failed to create subscription/usage for user ${id}`, subscriptionError as Error)
        
        // Still return success to prevent webhook retry loops
        return NextResponse.json({ 
          success: true, 
          affiliationCode,
          warning: 'Subscription/usage creation failed but user was created successfully'
        })
      }
    } catch (error) {
      logger.error(`Webhook: Failed to process user creation for ${id}`, error as Error)
      // Return success to prevent webhook retry, but log the error
      return NextResponse.json({ 
        success: true, 
        error: 'Failed to process user creation' 
      })
    }
  }

  // For other event types, just acknowledge
  return NextResponse.json({ success: true })
}