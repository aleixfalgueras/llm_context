import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createCustomerPortalSession } from '@/lib/stripe-utils'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized customer portal attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portalSession = await createCustomerPortalSession(userId)

    logger.info('Customer portal session created successfully', { 
      userId, 
      metadata: {
        sessionId: portalSession.id 
      }
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logger.error('Failed to create customer portal session', error as Error, { userId: (await auth()).userId ?? undefined })
    
    if (error instanceof Error && error.message.includes('No Stripe customer found')) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}