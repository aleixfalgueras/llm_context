import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    // Check authentication only - no usage limits for documents
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Authentication required', { status: 401 })
    }

    const { clientId, meetingDate, reportContent, additionalInfo: _additionalInfo, documentName } = await req.json()

    if (!clientId || !meetingDate || !reportContent) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use the shared document save utility with tracking enabled
    const result = await saveDocumentToStorage({
      clientId,
      content: reportContent,
      documentName,
      documentType: DOCUMENT_TYPES.MEETING,
      startDate: meetingDate,
      endDate: meetingDate,
      trackUsage: true // Explicitly enable usage tracking
    })

    return Response.json({
      ...result,
      documentId: result.document.id
    })
  } catch (error) {
    console.error('Error saving meeting report:', error)
    
    // Check for storage limit errors
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      return new Response(error.message, { status: 413 }) // 413 Payload Too Large
    }
    
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    )
  }
} 