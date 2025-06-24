import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { withAuthAndUsageCheck } from '@/lib/api-middleware'

export async function POST(req: Request) {
  try {
    // Use unified middleware for auth and usage checking
    const middleware = await withAuthAndUsageCheck('document')
    if (!middleware.success) {
      return middleware.response!
    }
    
    const userId = middleware.userId!

    const { clientId, meetingDate, reportContent, additionalInfo, documentName } = await req.json()

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
    
    // Check if it's a usage limit error
    if (error instanceof Error && error.message.includes('limit')) {
      return new Response(error.message, { status: 403 })
    }
    
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    )
  }
} 