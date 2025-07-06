import { currentUser } from '@clerk/nextjs/server'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { 
  FeedbackState,
  isValidFeedbackState 
} from '@/types/enums'

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

    // Validate feedback state
    if (!isValidFeedbackState(state)) {
      throw new Error('Invalid feedback state')
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: feedbackId }
    })

    if (!existingFeedback) {
      throw new Error('Feedback not found')
    }

    // Update feedback state
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { state },
      select: {
        id: true,
        state: true,
        title: true,
        type: true,
        priority: true,
        userEmail: true,
        userName: true
      }
    })

    // Log admin action (optional - could be expanded to audit log)
    console.log(`Admin ${userEmail} updated feedback ${feedbackId} state to ${state}`)

    return apiSuccess({ 
      feedback: updatedFeedback,
      message: `Feedback status updated to ${state.replace('_', ' ').toLowerCase()}`
    })
  },
  {
    context: 'Update Feedback Status (Admin)',
    allowedMethods: ['PATCH'],
    expectedContentType: 'application/json'
  }
)