/**
 * Document storage service - handles Supabase file operations only
 */

import { supabaseServer } from '../lib/supabase'
import { STORAGE_CONFIG } from '../lib/config'
import { logger } from '../lib/logger'

export class DocumentStorageService {
  /**
   * Store document content in Supabase storage
   */
  static async storeDocument(
    userId: string,
    clientId: string,
    documentId: string,
    fileName: string,
    content: string,
    mimeType: string = 'text/plain'
  ): Promise<{ path: string; url?: string }> {
    try {
      const filePath = `${userId}/${clientId}/${documentId}_${fileName}`
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
  static async getDocument(documentPath: string): Promise<string> {
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
  static async deleteDocument(documentPath: string): Promise<void> {
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
   * Check if document exists in storage
   */
  static async documentExists(documentPath: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .list(documentPath.split('/').slice(0, -1).join('/'), {
          search: documentPath.split('/').pop()
        })

      return !error && data && data.length > 0
    } catch (error) {
      logger.error('Document existence check error', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Update document content in storage
   */
  static async updateDocument(
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
  static async deleteClientFolder(userId: string, clientId: string): Promise<void> {
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
   * Generate storage file path for document
   */
  static generateFilePath(userId: string, fileName: string): string {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    return `${userId}/documents/${timestamp}_${sanitizedFileName}`
  }
}