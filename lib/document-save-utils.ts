'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'
import { DOCUMENT_TYPES, getDocumentTypeLabel, type DocumentType } from '@/types/document-types'
import { validateDocumentStorage, calculateDocumentSize } from '@/lib/storage-utils'

export interface SaveDocumentParams {
  clientId: string
  content: string
  documentName?: string
  documentType: DocumentType
  trackUsage?: boolean
}

export async function saveDocumentToStorage({
  clientId,
  content,
  documentName,
  documentType,
  trackUsage = true
}: SaveDocumentParams) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Check storage limits before proceeding
  await validateDocumentStorage(content, userId)

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  })
  
  if (!client) {
    throw new Error('Client not found')
  }

  const finalDocumentName = documentName || generateDefaultDocumentName(
    client.name,
    documentType
  )
  
  const fileName = `${finalDocumentName}.md`
  const filePath = `${userId}/${clientId}/${fileName}`

  // Calculate file size before uploading
  const fileSize = calculateDocumentSize(content)

  const { error: uploadError } = await supabaseServer.storage
    .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
    .upload(filePath, content, {
      contentType: 'text/markdown',
      upsert: true,
    })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    throw new Error('Failed to save document to storage')
  }

  const document = await prisma.document.create({
    data: {
      userId,
      clientId,
      documentName: finalDocumentName,
      documentPath: filePath,
      documentType,
      fileSize: fileSize, // Store file size in database
    },
  })

  if (trackUsage) {
    try {
      const { trackUsage: trackUsageEvent } = await import('./usage-middleware')
      await trackUsageEvent(userId, {
        documentType,
        clientId,
        documentName: finalDocumentName
      })
    } catch (error) {
      console.error('Error tracking usage:', error)
    }
  }

  // Invalidate storage cache since storage usage has changed
  try {
    const { invalidateStorageCache } = await import('./subscription-cache')
    invalidateStorageCache(userId)
  } catch (error) {
    console.error('Error invalidating storage cache:', error)
  }

  return {
    success: true,
    document: {
      id: document.id,
      name: finalDocumentName,
      path: filePath,
      type: documentType
    }
  }
}



function generateDefaultDocumentName(
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