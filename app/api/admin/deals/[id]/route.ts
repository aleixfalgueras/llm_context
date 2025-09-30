import {
  withEnhancedApi,
  apiSuccess,
  parseJsonBody,
  ApiContext
} from '@/lib/api/api-middleware'
import { AdminService } from '@/services/admin-service'
import { DealService } from '@/services/deal-service'
import { logger } from '@/lib/logger'

export const PATCH = withEnhancedApi(
  async ({ userId, req, params }: ApiContext) => {
    // Extract and validate deal ID
    const dealId = params?.id as string
    if (!dealId) {
      throw new Error('Deal ID is required')
    }

    // Check admin access
    const isAdmin = await AdminService.isAdminUser(userId)
    if (!isAdmin) {
      logger.warn('Non-admin user attempted to access admin deal endpoint', { userId })
      throw new Error('Forbidden - Admin access required')
    }

    const body = await parseJsonBody(req)
    const { action } = body

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      throw new Error('Invalid action. Must be "approve" or "reject"')
    }

    // Process the action
    if (action === 'approve') {
      const result = await DealService.approveDeal(dealId)

      if (!result.success) {
        logger.error(`Failed to approve deal ${dealId}`, new Error(result.error || 'Unknown error'), { userId })
        throw new Error(result.error || 'Failed to approve deal')
      }

      logger.info(`Admin approved deal ${dealId}`, { userId })
      return apiSuccess({
        message: 'Deal approved successfully',
        deal: result.data
      })
    } else {
      // reject
      const result = await DealService.rejectDeal(dealId)

      if (!result.success) {
        logger.error(`Failed to reject deal ${dealId}`, new Error(result.error || 'Unknown error'), { userId })
        throw new Error(result.error || 'Failed to reject deal')
      }

      logger.info(`Admin rejected deal ${dealId}`, { userId })
      return apiSuccess({
        message: 'Deal rejected successfully'
      })
    }
  },
  {
    context: 'Admin Deal Management',
    allowedMethods: ['PATCH'],
    expectedContentType: 'application/json'
  }
)