/**
 * Document-specific database operations
 */

import { prisma } from '../prisma'
import { BaseOperations, PaginationConfig, DbOperationConfig } from './base-operations'

export class DocumentOperations extends BaseOperations {
  static async findUserDocuments(
    userId: string,
    clientId?: string,
    pagination?: PaginationConfig,
    config: DbOperationConfig = {}
  ) {
    const filters = clientId ? { clientId } : {}
    
    // If config has select, use it instead of include
    const queryConfig = config.select ? {
      context: 'Find user documents',
      ...config
    } : {
      context: 'Find user documents',
      include: {
        client: {
          select: { id: true, name: true }
        }
      },
      ...config
    }
    
    return this.findUserOwnedRecords(
      prisma.document,
      userId,
      filters,
      pagination,
      queryConfig
    )
  }

  static async createDocument(userId: string, data: any) {
    return this.createUserOwnedRecord(
      prisma.document,
      userId,
      data,
      { context: 'Create document' }
    )
  }

  static async updateDocument(documentId: string, userId: string, data: any) {
    return this.updateUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      data,
      { context: 'Update document' }
    )
  }

  static async deleteDocument(documentId: string, userId: string) {
    return this.deleteUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      { context: 'Delete document' }
    )
  }
}