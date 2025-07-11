import { currentUser } from '@clerk/nextjs/server'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import { prisma } from '@/lib/prisma'
import { 
  FeedbackType, 
  FeedbackState,
  isValidFeedbackType,
  isValidPriority,
  isValidFeedbackState 
} from '@/types/enums'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    // Get the current user information
    const user = await currentUser()
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Anonymous'
    const userEmail = user?.emailAddresses[0]?.emailAddress

    const body = await parseJsonBody(req)
    const { type, title, description, priority, useCase, stepsToReproduce } = body

    // Validate required fields
    if (!type || !title || !description || !priority) {
      throw new Error('Missing required fields: type, title, description, and priority are required')
    }

    // Validate feedback type
    if (!isValidFeedbackType(type)) {
      throw new Error('Invalid feedback type')
    }

    // Validate priority values
    if (!isValidPriority(priority)) {
      throw new Error('Invalid priority value')
    }

    // Save feedback to database
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        userEmail,
        userName,
        type,
        title,
        description,
        priority,
        useCase: useCase || null,
        stepsToReproduce: stepsToReproduce || null,
      }
    })

    const feedbackTypeLabel = type === FeedbackType.FEATURE ? 'feature request' : 
                             type === FeedbackType.BUG ? 'bug report' : 'feedback'

    return apiSuccess({ 
      feedbackId: feedback.id,
      message: `${feedbackTypeLabel.charAt(0).toUpperCase() + feedbackTypeLabel.slice(1)} submitted successfully`
    })
  },
  {
    context: 'Submit Feedback',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)

export const GET = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    // Get feedback for the current user
    const feedbacks = await prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return apiSuccess({ feedbacks })
  },
  {
    context: 'Get User Feedback',
    allowedMethods: ['GET']
  }
) 