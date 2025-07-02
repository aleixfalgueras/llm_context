/**
 * Prompt-specific database operations
 */

import { prisma } from '../prisma'
import { BaseOperations, PaginationConfig, DbOperationConfig } from './base-operations'

export class PromptOperations extends BaseOperations {
  static async findUserPrompts(
    userId: string,
    filters: { category?: string; isActive?: boolean } = {},
    pagination?: PaginationConfig,
    config: DbOperationConfig = {}
  ) {
    return this.findUserOwnedRecords(
      prisma.prompt,
      userId,
      filters,
      pagination,
      { context: 'Find user prompts', ...config }
    )
  }

  static async createPrompt(userId: string, data: any) {
    return this.createUserOwnedRecord(
      prisma.prompt,
      userId,
      data,
      { context: 'Create prompt' }
    )
  }

  static async updatePrompt(promptId: string, userId: string, data: any) {
    return this.updateUserOwnedRecord(
      prisma.prompt,
      promptId,
      userId,
      data,
      { context: 'Update prompt' }
    )
  }

  static async deletePrompt(promptId: string, userId: string) {
    return this.deleteUserOwnedRecord(
      prisma.prompt,
      promptId,
      userId,
      { context: 'Delete prompt' }
    )
  }

  static async incrementPromptUsage(promptId: string, userId: string) {
    return this.updateUserOwnedRecord(
      prisma.prompt,
      promptId,
      userId,
      { usageCount: { increment: 1 } },
      { context: 'Increment prompt usage' }
    )
  }
}