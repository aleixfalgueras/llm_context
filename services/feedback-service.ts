import {currentUser} from '@clerk/nextjs/server'
import {FeedbackOperations} from '@/database/feedback-operations'
import {logger} from '@/lib/logger'
import {Feedback, Prisma} from '@prisma/client'

import {unwrapResult} from '@/database/base-operations'
import {
  FeedbackState,
  FeedbackSubmissionData,
  FeedbackSubmissionResult,
  FeedbackType,
  Priority
} from "@/lib/types/feedback-types";

// VALIDATION HELPERS

export function isValidFeedbackType(type: string): type is FeedbackType {
  return Object.values(FeedbackType).includes(type as FeedbackType)
}

export function isValidPriority(priority: string): priority is Priority {
  return Object.values(Priority).includes(priority as Priority)
}

export function isValidFeedbackState(state: string): state is FeedbackState {
  return Object.values(FeedbackState).includes(state as FeedbackState)
}

export class FeedbackService {
  
  static async submitFeedback(
    userId: string, 
    data: FeedbackSubmissionData
  ): Promise<FeedbackSubmissionResult> {
    const { type, title, description, priority, useCase, stepsToReproduce } = data

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

    // Get user information
    const user = await currentUser()
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || 'Anonymous'
    const userEmail = user?.emailAddresses[0]?.emailAddress

    // Prepare data for database
    const feedbackData: Omit<Prisma.FeedbackCreateInput, 'userId'> = {
      userEmail,
      userName,
      type,
      title,
      description,
      priority,
      useCase: useCase || null,
      stepsToReproduce: stepsToReproduce || null,
    }

    // Create feedback in database
    const result = await FeedbackOperations.createFeedback(userId, feedbackData)
    const feedback = unwrapResult(result)

    // Generate appropriate message
    const feedbackTypeLabel = type === FeedbackType.feature ? 'feature request' : 
                             type === FeedbackType.bug ? 'bug report' : 'feedback'

    logger.info(`Feedback id ${feedback.id} submitted successfully`)

    return {
      feedbackId: feedback.id,
      message: `${feedbackTypeLabel.charAt(0).toUpperCase() + feedbackTypeLabel.slice(1)} submitted successfully`
    }
  }

  static async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    const result = await FeedbackOperations.findUserFeedbacks(userId)
    const data = unwrapResult(result)
    return data.records
  }

  static async updateFeedbackState(
    feedbackId: string,
    state: FeedbackState,
    adminEmail: string
  ): Promise<{ feedback: Partial<Feedback>; message: string }> {
    // Validate feedback state
    if (!isValidFeedbackState(state)) {
      throw new Error('Invalid feedback state')
    }

    // Check if feedback exists
    const existingResult = await FeedbackOperations.findFeedbackByIdAdmin(feedbackId)
    const existingFeedback = unwrapResult(existingResult)

    if (!existingFeedback) {
      throw new Error('Feedback not found')
    }

    // Update feedback state
    const result = await FeedbackOperations.updateFeedbackState(feedbackId, state)
    const updatedFeedback = unwrapResult(result)

    // Log admin action
    logger.info(`Admin updated feedback state for feedback id ${feedbackId}`)

    return {
      feedback: {
        id: updatedFeedback.id,
        state: updatedFeedback.state,
        title: updatedFeedback.title,
        type: updatedFeedback.type,
        priority: updatedFeedback.priority,
        userEmail: updatedFeedback.userEmail,
        userName: updatedFeedback.userName
      },
      message: `Feedback status updated to ${state.replace('_', ' ').toLowerCase()}`
    }
  }
}