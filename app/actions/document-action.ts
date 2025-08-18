'use server'

import {DocumentService} from '@/services/document-service'
import {checkAuth} from '@/lib/api/api-validation'
import {revalidatePath} from 'next/cache'
import {Document, DocumentType} from '@prisma/client'

export async function getDocuments(clientId: string): Promise<{ records: Document[], totalCount: number }> {
  const userId = await checkAuth()
  
  if (!clientId) {
    throw new Error('Client ID is required')
  }

  const result = await DocumentService.getClientDocuments(userId, clientId)
  return {
    records: result.records,
    totalCount: result.total ?? result.records.length
  }
}

export async function createDocument(
  clientId: string,
  documentName: string,
  documentType: DocumentType,
  content: string
): Promise<{ document: Document, message: string }> {
  const userId = await checkAuth()

  if (!clientId || !documentName || !documentType || !content) {
    throw new Error('Missing required fields')
  }

  const result = await DocumentService.createDocument(
    userId,
    clientId,
    documentName,
    documentType,
    content
  )

  revalidatePath('/clients')
  return {
    document: result.document,
    message: 'Document created successfully'
  }
}

export async function updateDocument(
  documentId: string,
  updates: Partial<{ documentName: string; documentType: DocumentType; content: string }>
): Promise<{ document: Document, message: string }> {
  const userId = await checkAuth()

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('Updates are required')
  }

  const allowedFields = ['documentName', 'documentType', 'content']
  const updateKeys = Object.keys(updates)
  const invalidFields = updateKeys.filter(key => !allowedFields.includes(key))
  
  if (invalidFields.length > 0) {
    throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`)
  }

  if (updates.content !== undefined && updates.content.length === 0) {
    throw new Error('Content cannot be empty')
  }

  const document = await DocumentService.updateDocument(userId, documentId, updates)
  revalidatePath('/clients')
  return {
    document,
    message: 'Document updated successfully'
  }
}

export async function deleteDocument(documentId: string): Promise<{ message: string }> {
  const userId = await checkAuth()

  await DocumentService.deleteDocument(userId, documentId)
  revalidatePath('/clients')
  return {
    message: 'Document deleted successfully'
  }
}

export async function deleteAllDocuments(clientId: string): Promise<{ message: string; deletedCount: number }> {
  const userId = await checkAuth()

  if (!clientId) {
    throw new Error('Client ID is required')
  }

  const documentsResult = await DocumentService.getClientDocuments(userId, clientId)
  
  if (!documentsResult || !documentsResult.records || !Array.isArray(documentsResult.records) || documentsResult.records.length === 0) {
    return {
      message: 'No documents found for this client',
      deletedCount: 0
    }
  }

  const documentIds = documentsResult.records.map(doc => doc.id)

  try {
    await DocumentService.bulkDeleteDocuments(userId, documentIds)

    revalidatePath('/clients')
    return {
      message: `Successfully deleted ${documentIds.length} documents from both database and storage`,
      deletedCount: documentIds.length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isStorageError = errorMessage.includes('Storage deletion failed')
    
    throw new Error(
      isStorageError 
        ? 'Failed to delete documents from storage. Please try again or contact support if the issue persists.'
        : 'Failed to delete all documents'
    )
  }
}

export async function getDocumentContent(documentId: string): Promise<string> {
  const userId = await checkAuth()

  return await DocumentService.getDocumentContent(userId, documentId)
}
