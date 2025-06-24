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
  trackUsage?: boolean
}

export async function saveDocumentToStorage({
  clientId,
  content,
  documentName,
  documentType,
  startDate,
  endDate,
  trackUsage = true
}: SaveDocumentParams) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  if (trackUsage) {
    const usageCheck = await checkDocumentUsageLimit(userId)
    if (!usageCheck.allowed) {
      throw new Error(usageCheck.message || 'Document creation limit exceeded')
    }
  }

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
    documentType,
    startDate,
    endDate
  )
  
  const fileName = `${finalDocumentName}.md`
  const filePath = `${userId}/${clientId}/${fileName}`

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
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  })

  if (trackUsage) {
    try {
      const { trackUsage: trackUsageEvent } = await import('./usage-middleware')
      await trackUsageEvent(userId, 'document_generation', document.id, {
        documentType,
        clientId,
        documentName: finalDocumentName
      })
    } catch (error) {
      console.error('Error tracking document creation usage:', error)
    }
  }

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

async function checkDocumentUsageLimit(userId: string) {
  try {
    const { getUsageInfo } = await import('./usage-middleware')
    const usageInfo = await getUsageInfo(userId)
    
    if (!usageInfo?.documents) {
      return { allowed: true, limit: 'unlimited' as const, used: 0 }
    }
    
    return {
      allowed: usageInfo.documents.allowed,
      limit: usageInfo.documents.limit,
      used: usageInfo.documents.used,
      remaining: usageInfo.documents.remaining,
      message: usageInfo.documents.allowed 
        ? undefined
        : `You've reached your document limit of ${usageInfo.documents.limit} for this month. Upgrade your plan to create more documents.`
    }
  } catch (error) {
    console.error('Error checking document usage limit:', error)
    return { allowed: true, limit: 'unlimited' as const, used: 0 }
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