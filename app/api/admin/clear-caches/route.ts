import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { AdminService } from '@/services/admin-service'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    logger.apiRequest('POST', '/api/admin/clear-caches')
    
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access to clear caches API')
      logger.apiResponse('POST', '/api/admin/clear-caches', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use AdminService to clear caches (includes admin check)
    const result = await AdminService.clearAllServerCaches(userId)
    
    logger.apiResponse('POST', '/api/admin/clear-caches', 200)
    
    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error clearing caches', error as Error)
    
    // Check if it's a forbidden error
    if (error instanceof Error && error.message.includes('Forbidden')) {
      logger.apiResponse('POST', '/api/admin/clear-caches', 403)
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    logger.apiResponse('POST', '/api/admin/clear-caches', 500)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}