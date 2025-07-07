/**
 * Document service - orchestrates repository and storage operations
 */

import { auth } from '@clerk/nextjs/server'
import { DocumentRepository, DocumentData, DocumentQueryOptions } from './repository'
import { DocumentStorageService } from './storage-service'
import { validateDocumentStorage, calculateDocumentSize } from '../storage-utils'
import { logger } from '../logger'
import { prisma } from '../prisma'
import { DOCUMENT_TYPES, getDocumentTypeLabel, type DocumentType } from '@/types/document-types'

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
    documentName: string | undefined,
    documentType: DocumentType,
    content: string,
    options?: {
      metadata?: Record<string, any>
      trackUsage?: boolean
    }
  ) {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Unauthorized')
    }

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

    // Store content in Supabase
    const fileName = `${finalDocumentName}.md`
    const storageResult = await DocumentStorageService.storeDocument(
      userId,
      clientId,
      fileName,
      content,
      'text/markdown'
    )

    // Create database record
    const documentData: DocumentData = {
      documentName: finalDocumentName,
      documentType,
      documentPath: storageResult.path,
      clientId,
      fileSize: fileSize
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

    // Track usage if enabled (default: true)
    const trackUsage = options?.trackUsage !== false
    if (trackUsage) {
      try {
        const { trackUsage: trackUsageEvent } = await import('../usage-middleware')
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
      const { invalidateStorageCache } = await import('../subscription-cache')
      invalidateStorageCache(userId)
    } catch (error) {
      logger.error('Error invalidating storage cache', error instanceof Error ? error : new Error(String(error)))
    }

    return {
      success: true,
      document: {
        id: result.data?.id || '',
        name: finalDocumentName,
        path: storageResult.path,
        type: documentType
      }
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<Pick<DocumentData, 'documentName' | 'documentType'>>
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

    // Delete from storage (critical operation - must succeed)
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

    logger.info(`Successfully deleted ${validDocuments.length} documents (${documentsWithStoragePaths.length} from storage)`)
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