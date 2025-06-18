'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'

export async function getClientDocuments(clientId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const documents = await prisma.document.findMany({
      where: { 
        clientId,
        userId 
      },
      orderBy: { createdAt: 'desc' }
    })

    return documents
  } catch (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Failed to fetch documents')
  }
}

export async function deleteDocument(documentId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get the document to verify ownership and get file path
    const document = await prisma.document.findFirst({
      where: { 
        id: documentId,
        userId 
      }
    })

    if (!document) {
      throw new Error('Document not found or unauthorized')
    }

    // Delete from Supabase storage
    const { error: storageError } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .remove([document.documentPath])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { 
        id: documentId,
        userId // Ensure user can only delete their own documents
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    throw new Error('Failed to delete document')
  }
}

export async function getDocumentContent(documentPath: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify the document belongs to the user
    const document = await prisma.document.findFirst({
      where: { 
        documentPath,
        userId 
      }
    })

    if (!document) {
      throw new Error('Document not found or unauthorized')
    }

    // Get file content from Supabase storage
    const { data, error } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .download(documentPath)

    if (error) {
      throw new Error('Failed to download document')
    }

    const content = await data.text()
    return content
  } catch (error) {
    console.error('Error getting document content:', error)
    throw new Error('Failed to get document content')
  }
} 