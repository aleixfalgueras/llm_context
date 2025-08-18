import {supabaseServer} from '@/lib/supabase'
import {STORAGE_CONFIG} from '@/lib/config'
import {logger} from '@/lib/logger'
import {StorageUsage} from "@/lib/types/storage-types";


export class StorageService {

  /**
   * Store document content in Supabase storage
   */
  static async storeDocumentInStorage(
    userId: string,
    clientId: string | null,
    documentId: string,
    fileName: string,
    content: string,
    mimeType: string = 'text/plain'
  ): Promise<{ path: string; url?: string }> {
    try {
      const filePath = clientId 
        ? `${userId}/${clientId}/${documentId}_${fileName}`
        : `${userId}/${documentId}_${fileName}`
      const contentBuffer = Buffer.from(content, 'utf-8')

      const { data, error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .upload(filePath, contentBuffer, {
          contentType: mimeType,
          upsert: true
        })

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`)
      }

      // Get public URL if needed
      let publicUrl: string | undefined
      try {
        const { data: urlData } = supabaseServer.storage
          .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
          .getPublicUrl(filePath)
        publicUrl = urlData.publicUrl
      } catch (urlError) {
        logger.warn('Failed to get public URL for document')
      }

      return {
        path: data.path,
        url: publicUrl
      }
    } catch (error) {
      logger.error('Document storage error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Retrieve document content from storage
   */
  static async getDocumentContentFromStorage(documentPath: string): Promise<string> {
    try {
      const { data, error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .download(documentPath)

      if (error) {
        throw new Error(`Storage download failed: ${error.message}`)
      }

      if (!data) {
        throw new Error('No data received from storage')
      }

      const content = await data.text()
      return content
    } catch (error) {
      logger.error('Document retrieval error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete document from storage
   */
  static async deleteDocumentFromStorage(documentPath: string): Promise<void> {
    try {
      // Try to delete the document at the given path
      const { error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .remove([documentPath])

      if (error) {
        // If the error is "file not found", it might be using the old path format
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          logger.info(`Document not found at ${documentPath}, checking for old path format`)
          
          // Try to construct and delete from old path format (userId/fileName)
          const pathParts = documentPath.split('/')
          if (pathParts.length >= 3) {
            const userId = pathParts[0]
            const fileName = pathParts[pathParts.length - 1] // Last part is the filename
            const oldPath = `${userId}/${fileName}`
            
            logger.info(`Trying to delete from old path format: ${oldPath}`)
            const { error: oldPathError } = await supabaseServer.storage
              .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
              .remove([oldPath])
            
            if (oldPathError) {
              throw new Error(`Storage deletion failed for both new and old path formats: ${error.message}`)
            }
            
            logger.info(`Successfully deleted document from old path format: ${oldPath}`)
            return
          }
        }
        
        throw new Error(`Storage deletion failed: ${error.message}`)
      }
      
      logger.info(`Successfully deleted document from storage: ${documentPath}`)
    } catch (error) {
      logger.error('Document deletion error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update document content in storage
   */
  static async updateDocumentContentInStorage(
    documentPath: string,
    content: string,
    mimeType: string = 'text/markdown'
  ): Promise<{ path: string; url?: string }> {
    try {
      const contentBuffer = Buffer.from(content, 'utf-8')

      const { data, error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .upload(documentPath, contentBuffer, {
          contentType: mimeType,
          upsert: true // This overwrites existing files
        })

      if (error) {
        throw new Error(`Storage update failed: ${error.message}`)
      }

      // Get public URL if needed
      let publicUrl: string | undefined
      try {
        const { data: urlData } = supabaseServer.storage
          .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
          .getPublicUrl(documentPath)
        publicUrl = urlData.publicUrl
      } catch (urlError) {
        logger.warn('Failed to get public URL for updated document')
      }

      return {
        path: data.path,
        url: publicUrl
      }
    } catch (error) {
      logger.error('Document update error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete all documents for a specific client (entire folder)
   * This is more efficient than deleting documents one by one
   */
  static async deleteClientFolderFromStorage(userId: string, clientId: string): Promise<void> {
    try {
      const folderPath = `${userId}/${clientId}`
      
      // List all files in the client folder
      const { data: files, error: listError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .list(folderPath, {
          limit: 1000, // Supabase default limit
          sortBy: { column: 'name', order: 'asc' }
        })

      if (listError) {
        // If folder doesn't exist, that's okay - nothing to delete
        if (listError.message.includes('not found') || listError.message.includes('does not exist')) {
          logger.info(`Client folder not found at ${folderPath}, nothing to delete`)
          return
        }
        throw new Error(`Failed to list files in client folder: ${listError.message}`)
      }

      // If no files found, nothing to delete
      if (!files || files.length === 0) {
        logger.info(`No files found in client folder ${folderPath}`)
        return
      }

      // Build full file paths for deletion
      const filePaths = files.map(file => `${folderPath}/${file.name}`)
      
      logger.info(`Found ${filePaths.length} files to delete in client folder ${folderPath}`)

      // Delete all files in a single batch operation
      const { error: deleteError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .remove(filePaths)

      if (deleteError) {
        throw new Error(`Failed to delete files from client folder: ${deleteError.message}`)
      }

      logger.info(`Successfully deleted ${filePaths.length} files from client folder ${folderPath}`)
      
    } catch (error) {
      logger.error('Client folder deletion error', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`Failed to delete client folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get current storage usage statistics for a user.
   * 
   * Queries the database to calculate total storage usage across all user documents.
   * Aggregates file sizes from the document records and provides breakdown by client.
   * Uses database-stored file sizes for accurate tracking.
   * 
   * @param userId - The user ID to calculate storage usage for
   * @returns Promise<StorageUsage> containing total bytes, document count, and usage by client
   * @throws Error if database query fails
   */
  static async getStorageUsage(userId: string): Promise<StorageUsage> {
    const {DocumentService} = await import('./document-service')
    
    try {
      // Get all documents for the user through DocumentService (proper service layer)
      const documents = await DocumentService.getAllUserDocuments(userId)

      let totalBytes = 0
      const usageByClient: Record<string, number> = {}

      // Calculate storage usage from database file sizes
      for (const doc of documents) {
        const fileSize = doc.fileSize || 0
        totalBytes += fileSize
        
        // Handle documents with or without clientId
        const clientKey = doc.clientId || 'general'
        if (!usageByClient[clientKey]) {
          usageByClient[clientKey] = 0
        }
        usageByClient[clientKey] += fileSize
      }

      return {
        totalBytes,
        documentCount: documents.length,
        usageByClient
      }
    } catch (error) {
      logger.error('Error calculating storage usage', error as Error, { userId })
      throw error
    }
  }
}