import { auth } from '@clerk/nextjs/server'
import { saveDocumentToStorage } from '@/lib/document-save-utils'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, meetingDate, reportContent, additionalInfo, documentName } = await req.json()

    if (!clientId || !meetingDate || !reportContent) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use the shared document save utility
    const result = await saveDocumentToStorage({
      clientId,
      content: reportContent,
      documentName,
      documentType: 'meeting',
      startDate: meetingDate,
      endDate: meetingDate
    })

    return Response.json({
      ...result,
      documentId: result.document.id
    })
  } catch (error) {
    console.error('Error saving meeting report:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    )
  }
} 