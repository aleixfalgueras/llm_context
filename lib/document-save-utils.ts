'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'
import { DOCUMENT_TYPES, getDocumentTypeLabel, type DocumentType } from '@/types/document-types'

export interface SaveDocumentParams {
  clientId: string
  content: string
  documentName?: string
  documentType: DocumentType
  startDate?: Date | string
  endDate?: Date | string
}

export async function saveDocumentToStorage({
  clientId,
  content,
  documentName,
  documentType,
  startDate,
  endDate
}: SaveDocumentParams) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Get client information for document name generation
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  })
  
  if (!client) {
    throw new Error('Client not found')
  }

  // Generate document name if not provided
  const finalDocumentName = documentName || generateDefaultDocumentName(
    client.name,
    documentType,
    startDate,
    endDate
  )
  
  const fileName = `${finalDocumentName}.md`
  const filePath = `${userId}/${clientId}/${fileName}`

  // Upload to Supabase storage
  const { error: uploadError } = await supabaseServer.storage
    .from(STORAGE_CONFIG.DOCUMENTS_BUCKET)
    .upload(filePath, content, {
      contentType: 'text/markdown',
      upsert: true, // Allow overwriting if file exists
    })

  if (uploadError) {
    console.error('Supabase upload error:', uploadError)
    throw new Error('Failed to save document to storage')
  }

  // Save document record to database
  const document = await prisma.document.create({
    data: {
      userId,
      clientId,
      documentName: finalDocumentName,
      documentPath: filePath,
      documentType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  })

  return {
    success: true,
    document: {
      id: document.id,
      name: finalDocumentName,
      path: filePath,
      type: documentType,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }
  }
}

function generateDefaultDocumentName(
  clientName: string,
  documentType: DocumentType,
  startDate?: Date | string,
  endDate?: Date | string
): string {
  switch (documentType) {
    case DOCUMENT_TYPES.MEETING:
      if (startDate) {
        const meetingDateFormatted = new Date(startDate).toISOString().split('T')[0]
        return `${clientName} Meeting Report ${meetingDateFormatted}`
      }
      return `${clientName} Meeting Report`
    
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