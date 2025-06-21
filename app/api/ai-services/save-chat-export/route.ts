import { auth } from '@clerk/nextjs/server'
import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { 
      clientId, 
      content, 
      chatTitle
    } = await request.json()

    if (!clientId || !content || !chatTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use the shared document save utility
    const result = await saveDocumentToStorage({
      clientId,
      content,
      documentName: chatTitle,
      documentType: DOCUMENT_TYPES.CHAT
    })

    return Response.json({
      ...result,
      documentId: result.document.id,
      message: 'Chat export saved successfully'
    })
  } catch (error) {
    console.error('Error saving chat export:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 