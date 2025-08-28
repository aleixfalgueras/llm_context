import { FeedbackType, FeedbackPriority, FeedbackState } from '@prisma/client'

export { FeedbackType, FeedbackState }
export { FeedbackPriority as Priority }

export const FEEDBACK_TYPE_VALUES = Object.values(FeedbackType)
export const PRIORITY_VALUES = Object.values(FeedbackPriority)

export interface FeedbackSubmissionData {
  type: string
  title: string
  description: string
  priority: string
  useCase?: string
  stepsToReproduce?: string
}

export interface FeedbackSubmissionResult {
  feedbackId: string
  message: string
}
