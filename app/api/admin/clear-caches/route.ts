import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { clearAllCaches } from '@/lib/payments/subscription-cache'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

export async function POST() {
  try {
    logger.apiRequest('POST', '/api/admin/clear-caches')
    
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Unauthorized access to clear caches API')
      logger.apiResponse('POST', '/api/admin/clear-caches', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check email
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress

    // Check if user is admin
    if (userEmail !== ADMIN_EMAIL) {
      logger.warn('Non-admin user attempted to clear caches', { userId, metadata: { userEmail } })
      logger.apiResponse('POST', '/api/admin/clear-caches', 403)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Clear all server-side caches
    logger.info('Admin clearing all server-side caches', { userId, metadata: { userEmail } })
    
    await clearAllCaches()
    
    logger.info('All server-side caches cleared successfully', { userId, metadata: { userEmail } })
    logger.apiResponse('POST', '/api/admin/clear-caches', 200)
    
    return NextResponse.json({ 
      success: true, 
      message: 'All caches cleared successfully',
      clearedCaches: [
        'subscription cache',
        'usage cache', 
        'storage cache',
        'client count cache'
      ]
    })

  } catch (error) {
    logger.error('Error clearing caches', error as Error)
    logger.apiResponse('POST', '/api/admin/clear-caches', 500)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}