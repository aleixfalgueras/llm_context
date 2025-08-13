import {PromptOperations} from '@/database'
import {logger} from '@/lib/logger'
import {Prompt} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'

export interface PromptListFilters {
  category?: string
  isActive?: boolean
  includeContent?: boolean
}

export class PromptService {
  /**
   * Get all user prompts with filters and sorting
   */
  static async getUserPrompts(
    userId: string, 
    filters: PromptListFilters = {}
  ): Promise<DbOperationResult<Prompt[]>> {
    try {
      const { category, isActive, includeContent = false } = filters

      const config = {
        context: 'Find user prompts',
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          isActive: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          ...(includeContent && { content: true })
        },
        orderBy: [
          { usageCount: 'desc' }, // Most used first
          { updatedAt: 'desc' }, // Then by recent updates
        ]
      }

      const result = await PromptOperations.findUserPrompts(
        userId, 
        { category, isActive }, 
        undefined, // no pagination
        config
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!.records as Prompt[]
      }
    } catch (error) {
      logger.error('Error fetching prompts', error as Error, { userId })
      return {
        success: false,
        error: 'Failed to fetch prompts'
      }
    }
  }

  /**
   * Get a single prompt by ID
   */
  static async getPromptById(
    promptId: string, 
    userId: string
  ): Promise<DbOperationResult<Prompt>> {
    return PromptOperations.findPromptById(promptId, userId)
  }

  /**
   * Create a new prompt
   */
  static async createPrompt(
    userId: string, 
    data: any
  ): Promise<DbOperationResult<Prompt>> {
    try {
      // Set default category if not provided
      const promptData = {
        ...data,
        category: data.category || 'general'
      }

      const result = await PromptOperations.createPrompt(userId, promptData)

      if (!result.success) {
        logger.error('Failed to create prompt', new Error(result.error), { userId })
      }

      return result as DbOperationResult<Prompt>
    } catch (error) {
      logger.error('Error creating prompt', error as Error, { userId })
      return {
        success: false,
        error: 'Failed to create prompt'
      }
    }
  }

  /**
   * Update an existing prompt
   */
  static async updatePrompt(
    promptId: string, 
    userId: string, 
    data: {
      name?: string
      description?: string
      content?: string
      category?: string
      isActive?: boolean
    }
  ): Promise<DbOperationResult<Prompt>> {
    try {
      // Validate required fields
      if (data.name !== undefined && !data.name) {
        return {
          success: false,
          error: 'Name is required'
        }
      }

      if (data.content !== undefined && !data.content) {
        return {
          success: false,
          error: 'Content is required'
        }
      }

      const result = await PromptOperations.updatePrompt(promptId, userId, data)

      if (!result.success) {
        logger.error('Failed to update prompt', new Error(result.error), { 
          userId, 
          metadata: { promptId }
        })
      }

      return result as DbOperationResult<Prompt>
    } catch (error) {
      logger.error('Error updating prompt', error as Error, { userId, metadata: { promptId } })
      return {
        success: false,
        error: 'Failed to update prompt'
      }
    }
  }

  /**
   * Delete a prompt
   */
  static async deletePrompt(
    promptId: string, 
    userId: string
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      const result = await PromptOperations.deletePrompt(promptId, userId)

      if (!result.success) {
        logger.error('Failed to delete prompt', new Error(result.error), { 
          userId, 
          metadata: { promptId }
        })
      }

      return result as DbOperationResult<{ id: string }>
    } catch (error) {
      logger.error('Error deleting prompt', error as Error, { userId, metadata: { promptId } })
      return {
        success: false,
        error: 'Failed to delete prompt'
      }
    }
  }

  /**
   * Track prompt usage by incrementing usage count
   */
  static async trackPromptUsage(
    promptId: string, 
    userId: string
  ): Promise<DbOperationResult<Prompt>> {
    try {
      const result = await PromptOperations.incrementPromptUsage(promptId, userId)

      if (!result.success) {
        logger.error('Failed to track prompt usage', new Error(result.error), { 
          userId, 
          metadata: { promptId }
        })
      }

      return result as DbOperationResult<Prompt>
    } catch (error) {
      logger.error('Error tracking prompt usage', error as Error, { userId, metadata: { promptId } })
      return {
        success: false,
        error: 'Failed to track prompt usage'
      }
    }
  }

}