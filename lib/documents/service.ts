/**
 * Document service - orchestrates repository and storage operations
 */

import { auth } from '@clerk/nextjs/server'
import { DocumentRepository, DocumentData, DocumentQueryOptions } from './repository'
import { DocumentStorageService } from './storage-service'
import { validateDocumentStorage } from '../storage-utils'
import { logger } from '../logger'

export class DocumentService {
  /**
   * Get client documents with authentication
   */
  static async getClientDocuments(clientId: string, options?: DocumentQueryOptions) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const result = await DocumentRepository.getClientDocuments(userId, clientId, options)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents')
    }

    return result.data
  }

  /**
   * Get user documents with authentication
   */
  static async getUserDocuments(options?: DocumentQueryOptions) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const result = await DocumentRepository.getUserDocuments(userId, options)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents')
    }

    return result.data
  }

  /**
   * Get document content with authentication
   */
  static async getDocumentContent(documentId: string): Promise<string> {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Get document metadata
    const documentResult = await DocumentRepository.getDocumentById(userId, documentId)
    
    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or access denied')
    }

    const document = documentResult.data as any
    
    if (!document.documentPath) {
      throw new Error('Document path not found')
    }

    // Get content from storage
    return DocumentStorageService.getDocument(document.documentPath)
  }

  /**
   * Create document with content storage
   */
  static async createDocument(
    clientId: string,
    documentName: string,
    documentType: string,
    content: string,
    metadata?: Record<string, any>
  ) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Validate storage constraints (throws error if validation fails)
    await validateDocumentStorage(content, userId)

    // Store content in Supabase
    const fileName = `${documentName}.txt`
    const storageResult = await DocumentStorageService.storeDocument(
      userId,
      fileName,
      content,
      'text/plain'
    )

    // Create database record
    const documentData: DocumentData = {
      documentName,
      documentType,
      documentPath: storageResult.path,
      clientId,
      metadata
    }

    const result = await DocumentRepository.createDocument(userId, documentData)

    if (!result.success) {
      // Cleanup storage if database creation failed
      try {
        await DocumentStorageService.deleteDocument(storageResult.path)
      } catch (cleanupError) {
        logger.error('Failed to cleanup storage after database error', cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
      }
      throw new Error(result.error || 'Failed to create document')
    }

    return result.data
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<Pick<DocumentData, 'documentName' | 'documentType' | 'metadata'>>
  ) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const result = await DocumentRepository.updateDocument(userId, documentId, updates)

    if (!result.success) {
      throw new Error(result.error || 'Failed to update document')
    }

    return result.data
  }

  /**
   * Delete document and its content
   */
  static async deleteDocument(documentId: string) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Get document to find storage path
    const documentResult = await DocumentRepository.getDocumentById(userId, documentId)
    
    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or access denied')
    }

    const document = documentResult.data as any

    // Delete from database first
    const deleteResult = await DocumentRepository.deleteDocument(userId, documentId)
    
    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to delete document')
    }

    // Delete from storage (non-blocking if it fails)
    if (document.documentPath) {
      try {
        await DocumentStorageService.deleteDocument(document.documentPath)
      } catch (storageError) {
        logger.error('Failed to delete document from storage', storageError instanceof Error ? storageError : new Error(String(storageError)))
        // Don't throw - database deletion was successful
      }
    }

    return deleteResult.data
  }

  /**
   * Bulk delete documents
   */
  static async bulkDeleteDocuments(documentIds: string[]) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Get all documents first to find storage paths
    const documents = await Promise.all(
      documentIds.map(id => DocumentRepository.getDocumentById(userId, id))
    )

    const validDocuments = documents
      .filter(result => result.success && result.data)
      .map(result => result.data! as any)

    if (validDocuments.length === 0) {
      throw new Error('No valid documents found')
    }

    // Delete from database
    const deleteResult = await DocumentRepository.bulkDeleteDocuments(
      userId,
      validDocuments.map(doc => doc.id)
    )

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to bulk delete documents')
    }

    // Delete from storage (best effort)
    const storagePromises = validDocuments
      .filter(doc => doc.documentPath)
      .map(doc => 
        DocumentStorageService.deleteDocument(doc.documentPath)
          .catch(error => {
            logger.error(`Failed to delete document ${doc.id} from storage`, error instanceof Error ? error : new Error(String(error)))
          })
      )

    await Promise.allSettled(storagePromises)

    return deleteResult.data
  }
}