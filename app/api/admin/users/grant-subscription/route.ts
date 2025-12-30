import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { AdminService } from '@/services/admin-service'
import { SubscriptionPlan, BillingInterval } from '@prisma/client'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    logger.apiRequest('POST', '/api/admin/users/grant-subscription')

    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access to admin grant subscription API')
      logger.apiResponse('POST', '/api/admin/users/grant-subscription', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, plan, billingInterval } = body

    // Validate required fields
    if (!targetUserId) {
      logger.apiResponse('POST', '/api/admin/users/grant-subscription', 400)
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      logger.apiResponse('POST', '/api/admin/users/grant-subscription', 400)
      return NextResponse.json({ error: 'Valid subscription plan is required' }, { status: 400 })
    }

    if (!billingInterval || !Object.values(BillingInterval).includes(billingInterval)) {
      logger.apiResponse('POST', '/api/admin/users/grant-subscription', 400)
      return NextResponse.json({ error: 'Valid billing interval is required' }, { status: 400 })
    }

    // Grant subscription (includes admin check)
    const result = await AdminService.grantUserSubscription(
      userId,
      targetUserId,
      plan,
      billingInterval
    )

    logger.apiResponse('POST', '/api/admin/users/grant-subscription', 200)

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error granting subscription', error as Error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        logger.apiResponse('POST', '/api/admin/users/grant-subscription', 403)
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        logger.apiResponse('POST', '/api/admin/users/grant-subscription', 400)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    logger.apiResponse('POST', '/api/admin/users/grant-subscription', 500)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
