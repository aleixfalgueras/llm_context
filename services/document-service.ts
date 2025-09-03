import {StorageService} from './storage-service'
import {ClientService} from './client/client-service'
import {logger} from '@/lib/logger'
import {DOCUMENT_TYPE_LABELS, type DocumentType, getDocumentTypeLabel} from '@/lib/types/document-types'
import {Document, DocumentType as DocumentTypeEnum} from '@prisma/client'
import {isSuccess} from '@/database/base-operations'
import {DocumentOperations} from '@/database'
import {invalidateStorageCache} from "@/services/subscription/subscription-cache"
import {SubscriptionErrorCode} from './error-codes'


export class DocumentService {
  /**
   * Calculate document size in bytes (UTF-8 encoding)
   */
  static calculateDocumentSize(content: string): number {
    return new Blob([content]).size
  }

  /**
   * Validate if a document can be saved without exceeding storage limits.
   *
   * Helper function that checks if saving a document would exceed the user's
   * storage quota. Calculates document size and performs storage validation.
   * Throws an error if validation fails.
   *
   * @param content - The document content to validate
   * @param userId - The user ID to validate storage limits for
   * @throws Error if storage limit would be exceeded
   * @returns Promise that resolves if validation passes
   */
  static async validateDocumentStorage(content: string, userId: string): Promise<void> {
    const {SubscriptionUsageService} = await import('./subscription/subscription-usage-service')

    try {
      const documentSize = this.calculateDocumentSize(content)
      const storageSubscriptionUsage = await SubscriptionUsageService.getStorageSubscriptionUsage(userId)
      const wouldExceedLimit = (storageSubscriptionUsage.usage.totalBytes + documentSize) > storageSubscriptionUsage.limit

      if (wouldExceedLimit) {
        throw new Error(SubscriptionErrorCode.STORAGE_LIMIT_EXCEEDED)
      }
    } catch (error) {
      logger.error('Error checking storage limit', error as Error, { userId })
      throw error
    }
  }

  /**
   * Get all user documents for storage calculations.
   * Returns minimal document data needed for storage usage analytics.
   */
  static async getAllUserDocuments(userId: string): Promise<Array<{ id: string; clientId: string | null; fileSize: number | null }>> {
    const config = {
      context: 'Get user documents for storage calculations',
      select: {
        id: true,
        clientId: true,
        fileSize: true
      }
    }

    const result = await DocumentOperations.findUserDocuments(userId, undefined, undefined, config)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents for storage calculations')
    }

    return result.data.records
  }

  /**
   * Get client documents
   */
  static async getClientDocuments(userId: string, clientId: string): Promise<{ records: Document[]; total?: number }> {
    const config = {
      context: 'Get client documents',
      select: {
        id: true,
        documentName: true,
        documentType: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    const result = await DocumentOperations.findUserDocuments(userId, clientId, undefined, config)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents')
    }

    return result.data
  }

  /**
   * Get document metadata
   */
  static async getDocumentMetadata(userId: string, documentId: string): Promise<Document> {
    const documentResult = await DocumentOperations.getDocumentById(
      documentId,
      userId
    )

    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or unauthorized')
    }

    return documentResult.data
  }

  /**
   * Get document content
   */
  static async getDocumentContent(userId: string, documentId: string): Promise<string> {
    // Get document metadata
    const documentResult = await DocumentOperations.getDocumentById(
      documentId,
      userId
    )

    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or access denied')
    }

    const document = documentResult.data as any

    if (!document.documentPath) {
      throw new Error('Document path not found')
    }

    // Get content from storage
    return StorageService.getDocumentContentFromStorage(document.documentPath)
  }

  /**
   * Create document with content storage
   */
  static async createDocument(
    userId: string,
    clientId: string | null,
    documentName: string | undefined,
    documentType: DocumentType,
    content: string
  ): Promise<{ success: true; document: Document }> {

    // Validate storage constraints (throws error if validation fails)
    await this.validateDocumentStorage(content, userId)

    let clientName = 'General'
    
    // Only validate client if clientId is provided
    if (clientId) {
      const clientResult = await ClientService.getUserClientById(clientId, userId)
      if (!clientResult.success) {
        throw new Error(clientResult.error)
      }
      clientName = clientResult.data.name
    }

    // Generate document name if not provided
    const finalDocumentName = documentName || this.generateDefaultDocumentName(
      clientName,
      documentType
    )

    // Calculate file size before uploading
    const fileSize = this.calculateDocumentSize(content)

    // Create database record first to get the generated ID
    const documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      documentName: finalDocumentName,
      documentType,
      documentPath: '', // Will be updated after storage
      clientId,
      fileSize: fileSize
    }

    const result = await DocumentOperations.createDocument(userId, documentData)

    if (!result.success) {
      throw new Error(result.error || 'Failed to create document')
    }

    const documentId = result.data?.id
    if (!documentId) {
      throw new Error('Failed to get document ID after creation')
    }

    // Store content in Supabase using the generated document ID
    let finalDocument: Document
    try {
      const storageResult = await StorageService.storeDocumentInStorage(
        userId,
        clientId,
        documentId,
        content,
        'text/markdown'
      )

      // Update document record with storage path
      const updateResult = await DocumentOperations.updateDocument(documentId, userId, {
        documentPath: storageResult.path
      })

      if (!updateResult.success) {
        // Cleanup storage if database update failed
        try {
          await StorageService.deleteDocumentFromStorage(storageResult.path)
        } catch (cleanupError) {
          logger.error('Failed to cleanup storage after database update error', cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
        }
        throw new Error(updateResult.error || 'Failed to update document with storage path')
      }

      if (!updateResult.data) {
        throw new Error('Failed to get updated document after storage path update')
      }
      
      finalDocument = updateResult.data
    } catch (storageError) {
      // Cleanup database record if storage failed
      try {
        await DocumentOperations.deleteDocument(documentId, userId)
      } catch (cleanupError) {
        logger.error('Failed to cleanup database record after storage error', cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
      }
      throw storageError
    }

    // Invalidate storage cache since storage usage has changed
    try {
      await invalidateStorageCache(userId)
    } catch (error) {
      logger.error('Error invalidating storage cache', error instanceof Error ? error : new Error(String(error)))
    }

    return {
      success: true,
      document: finalDocument
    }
  }

  /**
   * Update document metadata and/or content
   */
  static async updateDocument(
    userId: string,
    documentId: string,
    updates: Partial<Pick<Document, 'documentName' | 'documentType'>> & { content?: string }
  ): Promise<Document> {

    // Get current document to check permissions and get storage path
    const documentResult = await DocumentOperations.getDocumentById(
      documentId,
      userId
    )

    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or access denied')
    }

    const currentDocument = documentResult.data as any

    // Handle content update if provided
    if (updates.content !== undefined) {
      if (!currentDocument.documentPath) {
        throw new Error('Document path not found for content update')
      }

      // Validate storage constraints for content update
      await this.validateDocumentStorage(updates.content, userId)

      // Update content in storage
      await StorageService.updateDocumentContentInStorage(
        currentDocument.documentPath,
        updates.content,
        'text/markdown'
      )

      // Calculate new file size for database update
      const newFileSize = this.calculateDocumentSize(updates.content)

      // Add file size to metadata updates
      const metadataUpdates = {
        ...updates,
        fileSize: newFileSize
      }

      // Remove content from metadata updates since it's not stored in database
      delete metadataUpdates.content

      // Update metadata in database
      const result = await DocumentOperations.updateDocument(documentId, userId, metadataUpdates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document')
      }

      // Invalidate storage cache since storage usage may have changed
      try {
        await invalidateStorageCache(userId)
      } catch (error) {
        logger.error('Error invalidating storage cache', error instanceof Error ? error : new Error(String(error)))
      }

      return result.data
    } else {
      // Only metadata updates
      const result = await DocumentOperations.updateDocument(documentId, userId, updates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document')
      }

      return result.data
    }
  }

  /**
   * Delete document and its content
   */
  static async deleteDocument(userId: string, documentId: string): Promise<{ id: string }> {

    // Get document to find storage path
    const documentResult = await DocumentOperations.getDocumentById(
      documentId,
      userId
    )

    if (!documentResult.success || !documentResult.data) {
      throw new Error('Document not found or access denied')
    }

    const document = documentResult.data as any

    // Delete from database first
    const deleteResult = await DocumentOperations.deleteDocument(documentId, userId)

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to delete document')
    }

    // Delete from storage (non-blocking if it fails)
    if (document.documentPath) {
      try {
        await StorageService.deleteDocumentFromStorage(document.documentPath)
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
  static async bulkDeleteDocuments(userId: string, documentIds: string[]): Promise<{ deletedCount: number }> {

    // Get all documents first to find storage paths
    const documents = await DocumentOperations.bulkGetDocuments(
      documentIds,
      userId
    )

    const validDocuments = documents
      .filter(isSuccess)
      .map(result => result.data as Document)

    if (validDocuments.length === 0) {
      throw new Error('No valid documents found')
    }

    // Get the clientId from the first document (all documents should belong to the same client)
    const clientId = validDocuments[0].clientId

    // Verify all documents belong to the same client
    const allSameClient = validDocuments.every(doc => doc.clientId === clientId)
    if (!allSameClient) {
      logger.warn('Documents belong to different clients, falling back to individual deletion')
      return this.bulkDeleteDocumentsIndividually(userId, validDocuments)
    }

    // Delete from database
    const deleteResult = await DocumentOperations.bulkDeleteDocuments(
      validDocuments.map(doc => doc.id),
      userId
    )

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to bulk delete documents')
    }

    // Delete entire client folder from storage (optimized approach) - only if clientId exists
    if (clientId) {
      try {
        await StorageService.deleteClientFolderFromStorage(userId, clientId)
        logger.info(`Successfully deleted client folder for client ${clientId} with ${validDocuments.length} documents`)
      } catch (error) {
        const errorMessage = `Failed to delete client folder for client ${clientId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        logger.error(errorMessage, error instanceof Error ? error : new Error(String(error)))
        throw new Error(errorMessage)
      }
    } else {
      // For general documents without clientId, delete individually
      for (const doc of validDocuments) {
        if (doc.documentPath) {
          try {
            await StorageService.deleteDocumentFromStorage(doc.documentPath)
          } catch (storageError) {
            logger.error('Failed to delete document from storage', storageError instanceof Error ? storageError : new Error(String(storageError)))
          }
        }
      }
    }

    return deleteResult.data
  }

  /**
   * Fallback method for individual document deletion (used when documents belong to different clients)
   */
  private static async bulkDeleteDocumentsIndividually(userId: string, validDocuments: Document[]): Promise<{ deletedCount: number }> {
    // Delete from database
    const deleteResult = await DocumentOperations.bulkDeleteDocuments(
      validDocuments.map(doc => doc.id),
      userId
    )

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to bulk delete documents')
    }

    // Delete from storage individually (fallback approach)
    const documentsWithStoragePaths = validDocuments.filter(doc => doc.documentPath)
    const storageErrors: string[] = []

    for (const doc of documentsWithStoragePaths) {
      try {
        await StorageService.deleteDocumentFromStorage(doc.documentPath)
        logger.info(`Successfully deleted document ${doc.id} from storage`)
      } catch (error) {
        const errorMessage = `Failed to delete document ${doc.id} from storage: ${error instanceof Error ? error.message : 'Unknown error'}`
        logger.error(errorMessage, error instanceof Error ? error : new Error(String(error)))
        storageErrors.push(errorMessage)
      }
    }

    // If any storage deletions failed, throw an error
    if (storageErrors.length > 0) {
      throw new Error(`Storage deletion failed for ${storageErrors.length} documents: ${storageErrors.join('; ')}`)
    }

    logger.info(`Successfully deleted ${validDocuments.length} documents (${documentsWithStoragePaths.length} from storage) individually`)
    return deleteResult.data
  }

  /**
   * Generate default document name based on client name and document type
   */
  private static generateDefaultDocumentName(
    clientName: string,
    documentType: DocumentType
  ): string {
    switch (documentType) {
      case DocumentTypeEnum.meeting:
        const meetingDateFormatted = new Date().toISOString().split('T')[0]
        return `${clientName} ${DOCUMENT_TYPE_LABELS[DocumentTypeEnum.meeting]} ${meetingDateFormatted}`

      case DocumentTypeEnum.custom_document:
        return `${clientName} ${DOCUMENT_TYPE_LABELS[DocumentTypeEnum.custom_document]}`

      case DocumentTypeEnum.manual:
        return `${clientName} ${DOCUMENT_TYPE_LABELS[DocumentTypeEnum.manual]}`

      case DocumentTypeEnum.chat:
        return `${clientName} ${DOCUMENT_TYPE_LABELS[DocumentTypeEnum.chat]}`

      default:
        return `${clientName} ${getDocumentTypeLabel(documentType)}`
    }
  }
}