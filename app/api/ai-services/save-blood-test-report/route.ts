import { auth } from '@clerk/nextjs/server'
import { saveDocumentToStorage } from '@/lib/document-save-utils'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, testDate, additionalInfo, extractedData, reportContent, documentName } = await req.json()

    if (!clientId || !reportContent) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use extracted date if available, otherwise fall back to provided date or current date
    const finalTestDate = extractedData?.testInfo?.testDate || testDate || new Date().toISOString().split('T')[0]

    // Use the shared document save utility
    const result = await saveDocumentToStorage({
      clientId,
      content: reportContent,
      documentName,
      documentType: 'blood-test-analysis',
      startDate: finalTestDate,
      endDate: finalTestDate // For blood tests, start and end date are the same
    })

    return Response.json({
      success: true,
      document: {
        id: result.document.id,
        name: result.document.name,
        path: result.document.path,
        type: result.document.type,
        testDate: result.document.startDate,
      }
    })
  } catch (error) {
    console.error('Save blood test report error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
} 