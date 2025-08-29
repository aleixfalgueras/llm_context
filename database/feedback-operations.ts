import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {DbOperationConfig, DbOperationResult, PaginationConfig} from "@/lib/types/database-types"
import {Feedback, Prisma} from '@prisma/client'

import {FeedbackState} from "@/lib/types/feedback-types";

export class FeedbackOperations extends BaseOperations {

  static async findUserFeedbacks(
    userId: string,
    pagination?: PaginationConfig,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: Feedback[]; total?: number }>> {
    return this.findUserOwnedRecords<Feedback>(
      prisma.feedback,
      userId,
      {},
      pagination,
      { context: 'Find user feedbacks', orderBy: { createdAt: 'desc' }, ...config }
    )
  }

  static async findFeedbackById(
    feedbackId: string, 
    userId: string, 
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Feedback>> {
    return this.findUserOwnedRecord<Feedback>(
      prisma.feedback,
      feedbackId,
      userId,
      { context: 'Find feedback by ID', ...config }
    )
  }

  static async createFeedback(
    userId: string, 
    data: Omit<Prisma.FeedbackCreateInput, 'userId'>
  ): Promise<DbOperationResult<Feedback>> {
    return this.createUserOwnedRecord<Feedback>(
      prisma.feedback,
      userId,
      data,
      { context: 'Create feedback' }
    )
  }

  static async updateFeedbackState(
    feedbackId: string, 
    state: FeedbackState,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Feedback>> {
    try {
      const feedback = await prisma.feedback.update({
        where: { id: feedbackId },
        data: { state },
        select: {
          id: true,
          state: true,
          title: true,
          type: true,
          priority: true,
          userEmail: true,
          userName: true,
          userId: true,
          description: true,
          useCase: true,
          stepsToReproduce: true,
          createdAt: true
        }
      })

      return { success: true, data: feedback as Feedback }
    } catch (error) {
      const context = config.context || 'Update feedback state'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  static async findFeedbackByIdAdmin(
    feedbackId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Feedback>> {
    try {
      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId }
      })

      if (!feedback) {
        return { success: false, error: 'Feedback not found' }
      }

      return { success: true, data: feedback }
    } catch (error) {
      const context = config.context || 'Find feedback by ID (admin)'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  /**
   * Admin-specific: Find all feedback for admin dashboard
   * No userId restriction - admin sees all feedback
   */
  static async findAllFeedbackForAdmin(
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Feedback[]>> {
    try {
      const feedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          priority: true,
          state: true,
          userEmail: true,
          userName: true,
          description: true,
          createdAt: true,
          userId: true,
          useCase: true,
          stepsToReproduce: true
        }
      })

      return { success: true, data: feedbacks as Feedback[] }
    } catch (error) {
      const context = config.context || 'Admin: Find all feedback'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }
}