/**
 * Document repository - handles database operations only
 */

import { DocumentOperations, BaseOperations } from '../database'
import { prisma } from '../prisma'
import { logger } from '../logger'

export interface DocumentData {
  documentName: string
  documentType: string
  documentPath: string
  clientId?: string
}

export interface DocumentQueryOptions {
  includeContent?: boolean
  limit?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'documentName'
  order?: 'asc' | 'desc'
}

export class DocumentRepository {
  /**
   * Get documents for a specific client
   */
  static async getClientDocuments(
    userId: string,
    clientId: string,
    options?: DocumentQueryOptions
  ) {
    const pagination = options?.limit ? 
      { page: 1, limit: options.limit, skip: 0 } : 
      undefined

    const config = {
      context: 'Get client documents',
      select: {
        id: true,
        documentName: true,
        documentType: true,
        createdAt: true,
        updatedAt: true,
        ...(options?.includeContent && {
          documentPath: true
        })
      },
      orderBy: { 
        [options?.orderBy || 'createdAt']: options?.order || 'desc' 
      }
    }

    return DocumentOperations.findUserDocuments(userId, clientId, pagination, config)
  }

  /**
   * Get all documents for a user
   */
  static async getUserDocuments(
    userId: string,
    options?: DocumentQueryOptions
  ) {
    const pagination = options?.limit ? 
      { page: 1, limit: options.limit, skip: 0 } : 
      undefined

    const config = {
      context: 'Get user documents',
      select: {
        id: true,
        documentName: true,
        documentType: true,
        createdAt: true,
        updatedAt: true,
        clientId: true,
        ...(options?.includeContent && {
          documentPath: true
        })
      },
      orderBy: { 
        [options?.orderBy || 'createdAt']: options?.order || 'desc' 
      }
    }

    return DocumentOperations.findUserDocuments(userId, undefined, pagination, config)
  }

  /**
   * Get a specific document by ID
   */
  static async getDocumentById(userId: string, documentId: string) {
    return BaseOperations.findUserOwnedRecord(
      prisma.document,
      documentId,
      userId,
      { context: 'Get document by ID' }
    )
  }

  /**
   * Create a new document
   */
  static async createDocument(userId: string, data: DocumentData) {
    try {
      return DocumentOperations.createDocument(userId, data)
    } catch (error) {
      logger.error('Document creation error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument(
    userId: string,
    documentId: string,
    data: Partial<DocumentData>
  ) {
    try {
      return DocumentOperations.updateDocument(documentId, userId, data)
    } catch (error) {
      logger.error('Document update error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(userId: string, documentId: string) {
    try {
      return DocumentOperations.deleteDocument(documentId, userId)
    } catch (error) {
      logger.error('Document deletion error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get document count for a user
   */
  static async getDocumentCount(userId: string, clientId?: string) {
    try {
      const filters = clientId ? { clientId } : {}
      return BaseOperations.countUserOwnedRecords(
        prisma.document,
        userId,
        filters
      )
    } catch (error) {
      logger.error('Document count error', error instanceof Error ? error : new Error(String(error)))
      return 0
    }
  }

  /**
   * Bulk delete documents
   */
  static async bulkDeleteDocuments(userId: string, documentIds: string[]) {
    try {
      return BaseOperations.bulkDeleteUserOwnedRecords(
        prisma.document,
        documentIds,
        userId,
        { context: 'Bulk delete documents' }
      )
    } catch (error) {
      logger.error('Bulk document deletion error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to bulk delete documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}