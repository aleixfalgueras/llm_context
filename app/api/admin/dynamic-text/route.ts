import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'
import { AdminService } from '@/services/admin-service'
import { DynamicTextService } from '@/services/dynamic-text-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/dynamic-text
 * Fetch all dynamic texts grouped by category
 */
export async function GET() {
  try {
    logger.apiRequest('GET', '/api/admin/dynamic-text')

    const { userId } = await auth()
    if (!userId) {
      logger.apiResponse('GET', '/api/admin/dynamic-text', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await AdminService.isAdminUser(userId)
    if (!isAdmin) {
      logger.apiResponse('GET', '/api/admin/dynamic-text', 403)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dynamicTexts = await DynamicTextService.getAllGroupedByCategory()

    logger.apiResponse('GET', '/api/admin/dynamic-text', 200)
    return NextResponse.json({ data: dynamicTexts })

  } catch (error) {
    logger.error('Error fetching dynamic texts', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/dynamic-text
 * Update a dynamic text value
 */
export async function PATCH(request: Request) {
  try {
    logger.apiRequest('PATCH', '/api/admin/dynamic-text')

    const { userId } = await auth()
    if (!userId) {
      logger.apiResponse('PATCH', '/api/admin/dynamic-text', 401)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await AdminService.isAdminUser(userId)
    if (!isAdmin) {
      logger.apiResponse('PATCH', '/api/admin/dynamic-text', 403)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, value } = body

    if (!id || typeof value !== 'string') {
      logger.apiResponse('PATCH', '/api/admin/dynamic-text', 400)
      return NextResponse.json({ error: 'Missing id or value' }, { status: 400 })
    }

    const updated = await DynamicTextService.updateText(id, value)

    logger.apiResponse('PATCH', '/api/admin/dynamic-text', 200)
    return NextResponse.json({ success: true, data: updated })

  } catch (error) {
    logger.error('Error updating dynamic text', error as Error)

    if (error instanceof Error && error.message.includes('empty')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
