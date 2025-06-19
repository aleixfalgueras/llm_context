'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { supabaseServer } from '@/lib/supabase'
import { STORAGE_CONFIG } from '@/lib/config'

export interface SaveDocumentParams {
  clientId: string
  content: string
  documentName?: string
  documentType: string
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
  documentType: string,
  startDate?: Date | string,
  endDate?: Date | string
): string {
  switch (documentType) {
    case 'diet':
      if (startDate && endDate) {
        const startFormatted = new Date(startDate).toISOString().split('T')[0]
        const endFormatted = new Date(endDate).toISOString().split('T')[0]
        return `${clientName} Diet ${startFormatted} to ${endFormatted}`
      }
      return `${clientName} Diet`
    
    case 'workout':
      if (startDate && endDate) {
        const startFormatted = new Date(startDate).toISOString().split('T')[0]
        const endFormatted = new Date(endDate).toISOString().split('T')[0]
        return `${clientName} Workout ${startFormatted} to ${endFormatted}`
      }
      return `${clientName} Workout`
    
    case 'blood-test-analysis':
      if (startDate) {
        const testDateFormatted = new Date(startDate).toISOString().split('T')[0]
        return `${clientName} Blood Test Analysis ${testDateFormatted}`
      }
      return `${clientName} Blood Test Analysis`
    
    default:
      return `${clientName} ${documentType}`
  }
} 