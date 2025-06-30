'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'
import { validateDocumentStorage } from '@/lib/storage-utils'

export async function getClientDocuments(clientId: string, options?: { includeContent?: boolean; limit?: number }) {
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
      select: {
        id: true,
        documentName: true,
        documentType: true,
        createdAt: true,
        updatedAt: true,
        startDate: true,
        endDate: true,
        // Only include heavy fields when needed
        ...(options?.includeContent && {
          documentPath: true
        })
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.limit && { take: options.limit })
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

export async function deleteAllDocuments(clientId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Get all documents for the client to verify ownership and get file paths
    const documents = await prisma.document.findMany({
      where: { 
        clientId,
        userId 
      }
    })

    if (documents.length === 0) {
      return { success: true, deletedCount: 0 }
    }

    // Delete from Supabase storage
    const documentPaths = documents.map(doc => doc.documentPath)
    const { error: storageError } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .remove(documentPaths)

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const deleteResult = await prisma.document.deleteMany({
      where: { 
        clientId,
        userId // Ensure user can only delete their own documents
      }
    })

    return { success: true, deletedCount: deleteResult.count }
  } catch (error) {
    console.error('Error deleting all documents:', error)
    throw new Error('Failed to delete all documents')
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

export async function updateDocumentContent(documentId: string, content: string) {
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

    // Upload the updated content to Supabase storage
    const { error: uploadError } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .upload(document.documentPath, content, {
        contentType: 'text/markdown',
        upsert: true // This will overwrite the existing file
      })

    if (uploadError) {
      throw new Error('Failed to update document content')
    }

    // Update the updatedAt timestamp in the database
    await prisma.document.update({
      where: { id: documentId },
      data: { updatedAt: new Date() }
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating document content:', error)
    throw new Error('Failed to update document content')
  }
}

export async function updateDocumentNameAndContent(
  documentId: string, 
  newDocumentName: string, 
  content: string
) {
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

    // Create new document path with the new name and timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const pathParts = document.documentPath.split('/')
    const newDocumentPath = `${pathParts[0]}/${pathParts[1]}/${newDocumentName}_${timestamp}.md`

    // If the name changed, we need to handle file operations
    if (newDocumentPath !== document.documentPath) {
      // Upload content to new path
      const { error: uploadError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .upload(newDocumentPath, content, {
          contentType: 'text/markdown'
        })

      if (uploadError) {
        throw new Error('Failed to upload document with new name')
      }

      // Delete old file
      const { error: deleteError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .remove([document.documentPath])

      if (deleteError) {
        console.error('Error deleting old file:', deleteError)
        // Continue anyway as the new file was created
      }

      // Update database with new name and path
      await prisma.document.update({
        where: { id: documentId },
        data: { 
          documentName: newDocumentName,
          documentPath: newDocumentPath,
          updatedAt: new Date() 
        }
      })
    } else {
      // Just update content if name didn't change
      const { error: uploadError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .upload(document.documentPath, content, {
          contentType: 'text/markdown',
          upsert: true
        })

      if (uploadError) {
        throw new Error('Failed to update document content')
      }

      // Update timestamp
      await prisma.document.update({
        where: { id: documentId },
        data: { updatedAt: new Date() }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating document:', error)
    throw new Error('Failed to update document')
  }
}



export async function createDocument(
  clientId: string,
  documentName: string,
  documentType: string,
  content: string,
  startDate?: Date,
  endDate?: Date
) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Check storage limits before proceeding
  await validateDocumentStorage(content, userId)

  try {
    // Verify the client belongs to the user
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        userId 
      }
    })

    if (!client) {
      throw new Error('Client not found or unauthorized')
    }

    // Create the document path with timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const documentPath = `${userId}/${clientId}/${documentName}_${timestamp}.md`

    // Upload content to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
      .upload(documentPath, content, {
        contentType: 'text/markdown'
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      console.error('Document path:', documentPath)
      console.error('Bucket name:', STORAGE_CONFIG.DOCUMENTS_BUCKET)
      console.error('Upload data:', uploadData)
      
      // Try to get more info about the bucket
      const { data: bucketInfo, error: bucketError } = await supabaseServer.storage
        .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
        .list('', { limit: 1 })
      
      if (bucketError) {
        console.error('Bucket access error:', bucketError)
      } else {
        console.log('Bucket is accessible, list result:', bucketInfo)
      }
      
      throw new Error(`Failed to upload document: ${uploadError.message}`)
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        userId,
        clientId,
        documentName,
        documentPath,
        documentType,
        startDate,
        endDate
      }
    })

    // Track usage event for document creation
    try {
      const { trackUsage } = await import('./usage-middleware')
      await trackUsage(userId, 'document_generation', document.id, {
        documentType,
        clientId,
        documentName
      })
    } catch (error) {
      console.error('Error tracking document creation usage:', error)
      // Don't fail the document creation if usage tracking fails
    }

    return { success: true, document }
  } catch (error) {
    console.error('Error creating document:', error)
    throw new Error('Failed to create document')
  }
} 