import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { AdminService } from '@/services/admin-service'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    logger.apiRequest('GET', '/api/admin/users/spending-limit')
    
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access to admin users API')
      logger.apiResponse('GET', '/api/admin/users/spending-limit', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with subscriptions (includes admin check)
    const users = await AdminService.getUserSubscriptions(userId)
    
    logger.apiResponse('GET', '/api/admin/users/spending-limit', 200)
    
    return NextResponse.json({ users })

  } catch (error) {
    logger.error('Error fetching users with subscriptions', error as Error)
    
    // Check if it's an authorization error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      logger.apiResponse('GET', '/api/admin/users/spending-limit', 403)
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    logger.apiResponse('GET', '/api/admin/users/spending-limit', 500)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    logger.apiRequest('POST', '/api/admin/users/spending-limit')
    
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access to admin spending limit API')
      logger.apiResponse('POST', '/api/admin/users/spending-limit', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, customSpendingLimit } = body

    if (!targetUserId) {
      logger.apiResponse('POST', '/api/admin/users/spending-limit', 400)
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    // Update user's custom spending limit (includes admin check)
    const result = await AdminService.updateUserCustomSpendingLimit(
      userId,
      targetUserId,
      customSpendingLimit
    )
    
    logger.apiResponse('POST', '/api/admin/users/spending-limit', 200)
    
    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error updating user spending limit', error as Error)
    
    // Check if it's an authorization or validation error
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        logger.apiResponse('POST', '/api/admin/users/spending-limit', 403)
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('cannot be negative') || 
          error.message.includes('cannot exceed') ||
          error.message.includes('Invalid')) {
        logger.apiResponse('POST', '/api/admin/users/spending-limit', 400)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    
    logger.apiResponse('POST', '/api/admin/users/spending-limit', 500)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}