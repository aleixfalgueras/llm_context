import { prisma } from '@/lib/prisma'
import { BaseOperations } from './base-operations'
import {DbOperationConfig, PaginationConfig, DbOperationResult} from "@/lib/types/database-types"
import { Prompt } from '@prisma/client'

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

  static async findPromptById(
    promptId: string, 
    userId: string, 
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Prompt>> {
    return this.findUserOwnedRecord(
      prisma.prompt,
      promptId,
      userId,
      { context: 'Find prompt by ID', ...config }
    )
  }

}