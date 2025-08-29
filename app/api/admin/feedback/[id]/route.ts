import { currentUser } from '@clerk/nextjs/server'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'
import { AdminService } from '@/services/admin-service'

export const PATCH = withEnhancedApi(
  async ({ userId, req, params }: ApiContext) => {
    // Extract and validate feedback ID
    const feedbackId = params?.id as string
    if (!feedbackId) {
      throw new Error('Feedback ID is required')
    }

    // Get current user's email for admin check
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      throw new Error('Unauthorized: Could not verify user')
    }

    const body = await parseJsonBody(req)
    const { state } = body

    // Validate required fields
    if (!state) {
      throw new Error('State is required')
    }

    // Use AdminService to update feedback state (includes admin check)
    const result = await AdminService.updateFeedbackState(feedbackId, state, userEmail)

    return apiSuccess(result)
  },
  {
    context: 'Update Feedback Status (Admin)',
    allowedMethods: ['PATCH'],
    expectedContentType: 'application/json'
  }
)