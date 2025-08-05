/**
 * Document service - orchestrates repository and storage operations
 */

import {DocumentStorageService} from './storage-service'
import {ClientService} from './client-service'
import {calculateDocumentSize, validateDocumentStorage} from '../lib/utils/storage'
import {logger} from '../lib/logger'
import {prisma} from '../lib/prisma'
import {DOCUMENT_TYPES, type DocumentType, getDocumentTypeLabel} from '@/lib/types/document-types'
import {isSuccess, BaseOperations} from '@/database/base-operations'
import {DocumentOperations} from '../database'
import {invalidateStorageCache} from "@/lib/subscription/subscription-cache";
import { Document } from '@prisma/client'


export class DocumentService {
  /**
   * Get client documents
   */
  static async getClientDocuments(userId: string, clientId: string) {
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
   * Get document content
   */
  static async getDocumentContent(userId: string, documentId: string): Promise<string> {
    // Get document metadata
    const documentResult = await BaseOperations.findUserOwnedRecord<Document>(
      prisma.document,
      documentId,
      userId,
      { context: 'Get document by ID' }
    )
    
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
    content: string
  ) {

    // Validate storage constraints (throws error if validation fails)
    await validateDocumentStorage(content, userId)

    const clientResult = await ClientService.getUserClientById(clientId, userId)
    if (!clientResult.success) {
      throw new Error(clientResult.error)
    }
    const client = clientResult.data

    // Generate document name if not provided
    const finalDocumentName = documentName || this.generateDefaultDocumentName(
      client.name,
      documentType
    )

    // Calculate file size before uploading
    const fileSize = calculateDocumentSize(content)

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
      const updateResult = await DocumentOperations.updateDocument(documentId, userId, {
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
    updates: Partial<Pick<Document, 'documentName' | 'documentType'>> & { content?: string }
  ) {

    // Get current document to check permissions and get storage path
    const documentResult = await BaseOperations.findUserOwnedRecord<Document>(
      prisma.document,
      documentId,
      userId,
      { context: 'Get document by ID' }
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
  static async deleteDocument(userId: string, documentId: string) {

    // Get document to find storage path
    const documentResult = await BaseOperations.findUserOwnedRecord<Document>(
      prisma.document,
      documentId,
      userId,
      { context: 'Get document by ID' }
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
      documentIds.map(id => BaseOperations.findUserOwnedRecord<Document>(
        prisma.document,
        id,
        userId,
        { context: 'Get document by ID' }
      ))
    )

    const validDocuments = documents
      .filter(isSuccess)
      .map(result => result.data)

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
    const deleteResult = await BaseOperations.bulkDeleteUserOwnedRecords(
      prisma.document,
      validDocuments.map(doc => doc.id),
      userId,
      { context: 'Bulk delete documents' }
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
    const deleteResult = await BaseOperations.bulkDeleteUserOwnedRecords(
      prisma.document,
      validDocuments.map(doc => doc.id),
      userId,
      { context: 'Bulk delete documents' }
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