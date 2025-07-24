/**
 * Base database operation abstractions providing type-safe, reusable CRUD operations
 * with built-in ownership verification, error handling, and consistent patterns.
 */

import {Prisma} from '@prisma/client'
import {logger} from '../logger'
import {DbOperationConfig, DbOperationResult, PaginationConfig, UserOwnedModel} from "@/types/database-types";

/**
 * Type guard to check if a database operation was successful
 */
export function isSuccess<T>(result: DbOperationResult<T>): result is { success: true; data: T } {
  return result.success
}

/**
 * Type guard to check if a database operation failed
 */
export function isError<T>(result: DbOperationResult<T>): result is { success: false; error: string } {
  return !result.success
}

/**
 * Helper to extract data from successful result or throw error
 */
export function unwrapResult<T>(result: DbOperationResult<T>): T {
  if (isSuccess(result)) {
    return result.data
  }
  throw new Error(result.error)
}

/**
 * Generic CRUD operations for user-owned models
 */
export class BaseOperations {
  /**
   * Find a single record by ID with ownership verification
   */
  static async findUserOwnedRecord<T extends UserOwnedModel>(
    model: any, // Prisma model delegate
    recordId: string,
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<T>> {
    try {
      const { include, select } = config

      const record = await model.findFirst({
        where: { id: recordId, userId },
        include,
        select
      })

      if (!record) {
        return {
          success: false,
          error: 'Record not found or access denied'
        }
      }

      return {
        success: true,
        data: record
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      return {
        success: false,
        error: 'Database operation failed'
      }
    }
  }

  /**
   * Find multiple records owned by user with pagination
   */
  static async findUserOwnedRecords<T extends UserOwnedModel>(
    model: any,
    userId: string,
    filters: Record<string, any> = {},
    pagination?: PaginationConfig,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: T[]; total?: number }>> {
    try {
      const { include, select, orderBy } = config
      
      const where = { userId, ...filters }
      const queryOptions: any = { where, include, select, orderBy }

      if (pagination) {
        queryOptions.skip = pagination.skip ?? (pagination.page - 1) * pagination.limit
        queryOptions.take = pagination.limit
        // Default ordering can be overridden by config
        if (!queryOptions.orderBy) {
          queryOptions.orderBy = { updatedAt: 'desc' }
        }
      }

      const [records, total] = await Promise.all([
        model.findMany(queryOptions),
        pagination ? model.count({ where }) : Promise.resolve(undefined)
      ])

      return {
        success: true,
        data: { records, total }
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      return {
        success: false,
        error: 'Database operation failed'
      }
    }
  }

  /**
   * Create a new record with user ownership
   */
  static async createUserOwnedRecord<T extends UserOwnedModel>(
    model: any,
    userId: string,
    data: Omit<any, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<T>> {
    try {
      const { include, select } = config

      const record = await model.create({
        data: { ...data, userId },
        include,
        select
      })

      return {
        success: true,
        data: record
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'A record with this information already exists'
          }
        }
      }

      return {
        success: false,
        error: 'Database operation failed'
      }
    }
  }

  /**
   * Update a record with ownership verification
   */
  static async updateUserOwnedRecord<T extends UserOwnedModel>(
    model: any,
    recordId: string,
    userId: string,
    data: Partial<Omit<any, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<T>> {
    try {
      const { verifyOwnership = true, include, select } = config

      // Verify ownership first if required
      if (verifyOwnership) {
        const existing = await model.findFirst({
          where: { id: recordId, userId }
        })

        if (!existing) {
          return {
            success: false,
            error: 'Record not found or access denied'
          }
        }
      }

      const record = await model.update({
        where: { id: recordId },
        data,
        include,
        select
      })

      return {
        success: true,
        data: record
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Record not found'
          }
        }
        if (error.code === 'P2002') {
          return {
            success: false,
            error: 'A record with this information already exists'
          }
        }
      }

      return {
        success: false,
        error: 'Database operation failed'
      }
    }
  }

  /**
   * Delete a record with ownership verification
   */
  static async deleteUserOwnedRecord(
    model: any,
    recordId: string,
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      const { verifyOwnership = true } = config

      // Verify ownership first if required
      if (verifyOwnership) {
        const existing = await model.findFirst({
          where: { id: recordId, userId }
        })

        if (!existing) {
          return {
            success: false,
            error: 'Record not found or access denied'
          }
        }
      }

      await model.delete({
        where: { id: recordId }
      })

      return {
        success: true,
        data: { id: recordId }
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return {
            success: false,
            error: 'Record not found'
          }
        }
      }

      return {
        success: false,
        error: 'Database operation failed'
      }
    }
  }


  /**
   * Bulk operations with ownership verification
   */
  static async bulkDeleteUserOwnedRecords(
    model: any,
    recordIds: string[],
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ deletedCount: number }>> {
    try {

      const result = await model.deleteMany({
        where: {
          id: { in: recordIds },
          userId
        }
      })

      return {
        success: true,
        data: { deletedCount: result.count }
      }
    } catch (error) {
      logger.dbError('BaseOperations', 'unknown', error as Error, { operation: config.context })
      return {
        success: false,
        error: 'Bulk delete operation failed'
      }
    }
  }

  /**
   * Count records with filters
   */
  static async countUserOwnedRecords(
    model: any,
    userId: string,
    filters: Record<string, any> = {}
  ): Promise<number> {
    try {
      return await model.count({
        where: { userId, ...filters }
      })
    } catch (error) {
      console.error('Error counting records:', error)
      return 0
    }
  }

}