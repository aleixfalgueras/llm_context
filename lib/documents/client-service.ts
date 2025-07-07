/**
 * Document client service - handles client-side document operations through API calls
 */

import type { DocumentQueryOptions } from './repository'

export class DocumentClientService {
  /**
   * Get client documents via API
   */
  static async getClientDocuments(clientId: string, options?: DocumentQueryOptions) {
    const params = new URLSearchParams({ clientId })
    if (options?.limit) {
      params.append('limit', options.limit.toString())
    }
    
    const response = await fetch(`/api/documents?${params}`)

    if (!response.ok) {
      throw new Error('Failed to fetch client documents')
    }

    return response.json()
  }

  /**
   * Get document content via API
   */
  static async getDocumentContent(documentId: string): Promise<string> {
    const response = await fetch(`/api/documents/${documentId}/content`)

    if (!response.ok) {
      throw new Error('Failed to fetch document content')
    }

    const result = await response.json()
    return result.content
  }

  /**
   * Create document via API
   */
  static async createDocument(
    clientId: string,
    documentName: string,
    documentType: string,
    content: string,
    metadata?: Record<string, any>
  ) {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        documentName,
        documentType,
        content,
        metadata
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create document')
    }

    return response.json()
  }

  /**
   * Update document via API
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<{ documentName: string; documentType: string; content: string }>
  ) {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update document')
    }

    return response.json()
  }

  /**
   * Delete document via API
   */
  static async deleteDocument(documentId: string) {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to delete document')
    }

    return response.json()
  }

  /**
   * Delete all documents for a client via API
   */
  static async deleteAllDocuments(clientId: string) {
    const response = await fetch('/api/documents/delete-all', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId })
    })

    if (!response.ok) {
      throw new Error('Failed to delete all documents')
    }

    return response.json()
  }
}