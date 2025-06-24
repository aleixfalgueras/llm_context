import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { withAuthAndUsageCheck } from '@/lib/api-middleware'

export async function POST(request: Request) {
  try {
    // Use unified middleware for auth and usage checking
    const middleware = await withAuthAndUsageCheck('document')
    if (!middleware.success) {
      return middleware.response!
    }
    
    const userId = middleware.userId!

    const { 
      clientId, 
      content, 
      chatTitle
    } = await request.json()

    if (!clientId || !content || !chatTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use the shared document save utility with tracking enabled
    const result = await saveDocumentToStorage({
      clientId,
      content,
      documentName: chatTitle,
      documentType: DOCUMENT_TYPES.CHAT,
      trackUsage: true // Explicitly enable usage tracking
    })

    return Response.json({
      ...result,
      documentId: result.document.id,
      message: 'Chat export saved successfully'
    })
  } catch (error) {
    console.error('Error saving chat export:', error)
    
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