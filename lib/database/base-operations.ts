/**
 * Base database operation abstractions providing type-safe, reusable CRUD operations
 * with built-in ownership verification, error handling, and consistent patterns.
 */

import { Prisma } from '@prisma/client'

/**
 * Base interface for models with user ownership
 */
export interface UserOwnedModel {
  id: string
  userId: string
}

/**
 * Configuration for database operations
 */
export interface DbOperationConfig {
  /** Context string for error logging */
  context?: string
  /** Whether to verify user ownership (default: true) */
  verifyOwnership?: boolean
  /** Include relationships in queries */
  include?: Record<string, any>
  /** Select specific fields */
  select?: Record<string, any>
  /** Custom ordering for queries */
  orderBy?: Record<string, any> | Array<Record<string, any>>
}

/**
 * Result type for database operations
 */
export interface DbOperationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number
  limit: number
  skip?: number
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
      console.error(`Database error in ${config.context}:`, error)
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
      console.error(`Database error in ${config.context}:`, error)
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
      console.error(`Database error in ${config.context}:`, error)
      
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
      console.error(`Database error in ${config.context}:`, error)
      
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
      console.error(`Database error in ${config.context}:`, error)
      
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
   * Check if user owns a record
   */
  static async verifyUserOwnership(
    model: any,
    recordId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const record = await model.findFirst({
        where: { id: recordId, userId },
        select: { id: true }
      })
      return !!record
    } catch (error) {
      console.error('Error verifying ownership:', error)
      return false
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
      console.error(`Database error in ${config.context}:`, error)
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