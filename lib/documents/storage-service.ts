/**
 * Document storage service - handles Supabase file operations only
 */

import { supabaseServer } from '../supabase'
import { STORAGE_CONFIG } from '../config'
import { logger } from '../logger'

export class DocumentStorageService {
  /**
   * Store document content in Supabase storage
   */
  static async storeDocument(
    userId: string,
    clientId: string,
    fileName: string,
    content: string,
    mimeType: string = 'text/plain'
  ): Promise<{ path: string; url?: string }> {
    try {
      const filePath = `${userId}/${clientId}/${fileName}`
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
   * Generate storage file path for document
   */
  static generateFilePath(userId: string, fileName: string): string {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    return `${userId}/documents/${timestamp}_${sanitizedFileName}`
  }
}