/**
 * Document service - orchestrates repository and storage operations
 */

import { DocumentRepository, DocumentData, DocumentQueryOptions } from './repository'
import { DocumentStorageService } from './storage-service'
import { validateDocumentStorage, calculateDocumentSize } from '../utils/storage'
import { logger } from '../logger'
import { prisma } from '../prisma'
import { DOCUMENT_TYPES, getDocumentTypeLabel, type DocumentType } from '@/types/document-types'

export class DocumentService {
  /**
   * Get client documents
   */
  static async getClientDocuments(userId: string, clientId: string, options?: DocumentQueryOptions) {
    const result = await DocumentRepository.getClientDocuments(userId, clientId, options)

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch documents')
    }

    return result.data
  }

  /**
   * Get document content
   */
  static async getDocumentContent(userId: string, documentId: string): Promise<string> {
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
    userId: string,
    clientId: string,
    documentName: string | undefined,
    documentType: DocumentType,
    content: string,
    options?: {
      metadata?: Record<string, any>
      trackUsage?: boolean
    }
  ) {

    // Validate storage constraints (throws error if validation fails)
    await validateDocumentStorage(content, userId)

    // Validate client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })
    
    if (!client) {
      throw new Error('Client not found')
    }

    // Generate document name if not provided
    const finalDocumentName = documentName || this.generateDefaultDocumentName(
      client.name,
      documentType
    )

    // Calculate file size before uploading
    const fileSize = calculateDocumentSize(content)

    // Create database record first to get the generated ID
    const documentData: DocumentData = {
      documentName: finalDocumentName,
      documentType,
      documentPath: '', // Will be updated after storage
      clientId,
      fileSize: fileSize
    }

    const result = await DocumentRepository.createDocument(userId, documentData)

    if (!result.success) {
      throw new Error(result.error || 'Failed to create document')
    }

    const documentId = result.data?.id
    if (!documentId) {
      throw new Error('Failed to get document ID after creation')
    }

    // Store content in Supabase using the generated document ID
    const fileName = `${finalDocumentName}.md`
    let storagePath: string
    try {
      const storageResult = await DocumentStorageService.storeDocument(
        userId,
        clientId,
        documentId,
        fileName,
        content,
        'text/markdown'
      )
      storagePath = storageResult.path

      // Update document record with storage path
      const updateResult = await DocumentRepository.updateDocument(userId, documentId, {
        documentPath: storageResult.path
      })

      if (!updateResult.success) {
        // Cleanup storage if database update failed
        try {
          await DocumentStorageService.deleteDocument(storageResult.path)
        } catch (cleanupError) {
          logger.error('Failed to cleanup storage after database update error', cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
        }
        throw new Error(updateResult.error || 'Failed to update document with storage path')
      }
    } catch (storageError) {
      // Cleanup database record if storage failed
      try {
        await DocumentRepository.deleteDocument(userId, documentId)
      } catch (cleanupError) {
        logger.error('Failed to cleanup database record after storage error', cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)))
      }
      throw storageError
    }

    // Track usage if enabled (default: true)
    const trackUsage = options?.trackUsage !== false
    if (trackUsage) {
      try {
        const { trackUsage: trackUsageEvent } = await import('../middleware/api-middleware')
        await trackUsageEvent(userId, {
          documentType,
          clientId,
          documentName: finalDocumentName
        })
      } catch (error) {
        logger.error('Error tracking usage', error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Invalidate storage cache since storage usage has changed
    try {
      const { invalidateStorageCache } = await import('../subscription/subscription-cache')
      invalidateStorageCache(userId)
    } catch (error) {
      logger.error('Error invalidating storage cache', error instanceof Error ? error : new Error(String(error)))
    }

    return {
      success: true,
      document: {
        id: documentId,
        name: finalDocumentName,
        path: storagePath,
        type: documentType
      }
    }
  }

  /**
   * Update document metadata and/or content
   */
  static async updateDocument(
    userId: string,
    documentId: string,
    updates: Partial<Pick<DocumentData, 'documentName' | 'documentType'>> & { content?: string }
  ) {

    // Get current document to check permissions and get storage path
    const documentResult = await DocumentRepository.getDocumentById(userId, documentId)
    
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
      await validateDocumentStorage(updates.content, userId)

      // Update content in storage
      await DocumentStorageService.updateDocument(
        currentDocument.documentPath,
        updates.content,
        'text/markdown'
      )

      // Calculate new file size for database update
      const newFileSize = calculateDocumentSize(updates.content)
      
      // Add file size to metadata updates
      const metadataUpdates = {
        ...updates,
        fileSize: newFileSize
      }
      
      // Remove content from metadata updates since it's not stored in database
      delete metadataUpdates.content

      // Update metadata in database
      const result = await DocumentRepository.updateDocument(userId, documentId, metadataUpdates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document')
      }

      // Invalidate storage cache since storage usage may have changed
      try {
        const { invalidateStorageCache } = await import('../subscription/subscription-cache')
        invalidateStorageCache(userId)
      } catch (error) {
        logger.error('Error invalidating storage cache', error instanceof Error ? error : new Error(String(error)))
      }

      return result.data
    } else {
      // Only metadata updates
      const result = await DocumentRepository.updateDocument(userId, documentId, updates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document')
      }

      return result.data
    }
  }

  /**
   * Delete document and its content
   */
  static async deleteDocument(userId: string, documentId: string) {

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
  static async bulkDeleteDocuments(userId: string, documentIds: string[]) {

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

    // Get the clientId from the first document (all documents should belong to the same client)
    const clientId = validDocuments[0].clientId
    
    // Verify all documents belong to the same client
    const allSameClient = validDocuments.every(doc => doc.clientId === clientId)
    if (!allSameClient) {
      logger.warn('Documents belong to different clients, falling back to individual deletion')
      return this.bulkDeleteDocumentsIndividually(userId, validDocuments)
    }

    // Delete from database
    const deleteResult = await DocumentRepository.bulkDeleteDocuments(
      userId,
      validDocuments.map(doc => doc.id)
    )

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to bulk delete documents')
    }

    // Delete entire client folder from storage (optimized approach)
    try {
      await DocumentStorageService.deleteClientFolder(userId, clientId)
      logger.info(`Successfully deleted client folder for client ${clientId} with ${validDocuments.length} documents`)
    } catch (error) {
      const errorMessage = `Failed to delete client folder for client ${clientId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error(errorMessage, error instanceof Error ? error : new Error(String(error)))
      throw new Error(errorMessage)
    }

    return deleteResult.data
  }

  /**
   * Fallback method for individual document deletion (used when documents belong to different clients)
   */
  private static async bulkDeleteDocumentsIndividually(userId: string, validDocuments: any[]) {
    // Delete from database
    const deleteResult = await DocumentRepository.bulkDeleteDocuments(
      userId,
      validDocuments.map(doc => doc.id)
    )

    if (!deleteResult.success) {
      throw new Error(deleteResult.error || 'Failed to bulk delete documents')
    }

    // Delete from storage individually (fallback approach)
    const documentsWithStoragePaths = validDocuments.filter(doc => doc.documentPath)
    const storageErrors: string[] = []
    
    for (const doc of documentsWithStoragePaths) {
      try {
        await DocumentStorageService.deleteDocument(doc.documentPath)
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
      case DOCUMENT_TYPES.MEETING:
        const meetingDateFormatted = new Date().toISOString().split('T')[0]
        return `${clientName} Meeting Report ${meetingDateFormatted}`
      
      case DOCUMENT_TYPES.CUSTOM_DOCUMENT:
        return `${clientName} Custom Document`
      
      case DOCUMENT_TYPES.MANUAL:
        return `${clientName} Manual Document`
      
      case DOCUMENT_TYPES.CHAT:
        return `${clientName} Chat Export`
      
      default:
        return `${clientName} ${getDocumentTypeLabel(documentType)}`
    }
  }
}