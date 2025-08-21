import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { AffiliationService } from '@/services/affiliation-service'
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
      
      // Always create affiliation for ALL new users (with or without referral code)
      const result = await AffiliationService.getOrCreateUserAffiliationCode(
        id,
        referralCode, // Will be undefined if no referral code was used
        publicName
      )
      
      logger.info(`Webhook: Created affiliation for new user ${id} - code: ${result.affiliationCode}, parent: ${referralCode || 'none'}, isNew: ${result.isNew}`)
      
      return NextResponse.json({ 
        success: true, 
        affiliationCode: result.affiliationCode 
      })
    } catch (error) {
      logger.error(`Webhook: Failed to create affiliation for user ${id}`, error as Error)
      // Return success to prevent webhook retry, but log the error
      return NextResponse.json({ 
        success: true, 
        error: 'Failed to create affiliation' 
      })
    }
  }

  // For other event types, just acknowledge
  return NextResponse.json({ success: true })
}