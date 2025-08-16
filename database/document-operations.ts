/**
 * Document-specific database operations
 */

import {prisma} from '@/lib/prisma'
import {BaseOperations} from './base-operations'
import {Document} from '@prisma/client'
import {DbOperationConfig, DbOperationResult, PaginationConfig} from "@/lib/types/database-types";

export class DocumentOperations extends BaseOperations {

  static async getDocumentById(
    documentId: string,
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Document>> {
    return this.findUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      { ...config, context: config.context || 'Get document by ID' }
    )
  }

  static async findUserDocuments(
    userId: string,
    clientId?: string,
    pagination?: PaginationConfig,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ records: Document[]; total?: number }>> {
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

  static async createDocument(userId: string, data: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<DbOperationResult<Document>> {
    return this.createUserOwnedRecord(
      prisma.document,
      userId,
      data,
      { context: 'Create document' }
    )
  }

  static async updateDocument(documentId: string, userId: string, data: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<DbOperationResult<Document>> {
    return this.updateUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      data,
      { context: 'Update document' }
    )
  }

  static async deleteDocument(documentId: string, userId: string): Promise<DbOperationResult<{ id: string }>> {
    return this.deleteUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      { context: 'Delete document' }
    )
  }

  static async bulkGetDocuments(
    documentIds: string[],
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<Document>[]> {
    return await Promise.all(
      documentIds.map(id => this.findUserOwnedRecord<Document>(
        prisma.document,
        id,
        userId,
        {...config, context: config.context || 'Get document by ID'}
      ))
    )
  }

  static async bulkDeleteDocuments(
    documentIds: string[],
    userId: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<{ deletedCount: number }>> {
    return this.bulkDeleteUserOwnedRecords(
      prisma.document,
      documentIds,
      userId,
      { ...config, context: config.context || 'Bulk delete documents' }
    )
  }
}