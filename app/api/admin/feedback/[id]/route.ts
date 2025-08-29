import { currentUser } from '@clerk/nextjs/server'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'
import { FeedbackService } from '@/services/feedback-service'

const ADMIN_EMAIL = 'feina.aleix@gmail.com'

export const PATCH = withEnhancedApi(
  async ({ userId, req, params }: ApiContext) => {
    // Extract and validate feedback ID
    const feedbackId = params?.id as string
    if (!feedbackId) {
      throw new Error('Feedback ID is required')
    }

    // Get current user and check admin permissions
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress

    // Admin authentication check
    if (userEmail !== ADMIN_EMAIL) {
      throw new Error('Unauthorized: Admin access required')
    }

    const body = await parseJsonBody(req)
    const { state } = body

    // Validate required fields
    if (!state) {
      throw new Error('State is required')
    }

    const result = await FeedbackService.updateFeedbackState(feedbackId, state, userEmail!)

    return apiSuccess(result)
  },
  {
    context: 'Update Feedback Status (Admin)',
    allowedMethods: ['PATCH'],
    expectedContentType: 'application/json'
  }
)