import {ApiContext, apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {FeedbackService} from '@/services/feedback-service'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const body = await parseJsonBody(req)
    const { type, title, description, priority, useCase, stepsToReproduce } = body

    const result = await FeedbackService.submitFeedback(userId, {
      type,
      title,
      description,
      priority,
      useCase,
      stepsToReproduce
    })

    return apiSuccess(result)
  },
  {
    context: 'Submit Feedback',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)

export const GET = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    const feedbacks = await FeedbackService.getUserFeedbacks(userId)
    return apiSuccess({ feedbacks })
  },
  {
    context: 'Get User Feedback',
    allowedMethods: ['GET']
  }
) 