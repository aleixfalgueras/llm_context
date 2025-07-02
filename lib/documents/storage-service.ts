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
    fileName: string,
    content: string,
    mimeType: string = 'text/plain'
  ): Promise<{ path: string; url?: string }> {
    try {
      const filePath = `${userId}/${fileName}`
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
      const { error } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .remove([documentPath])

      if (error) {
        throw new Error(`Storage deletion failed: ${error.message}`)
      }
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