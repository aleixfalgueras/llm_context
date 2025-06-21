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
      documentTitle, 
      promptName
    } = await request.json()

    if (!clientId || !content || !documentTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use the shared document save utility
    const result = await saveDocumentToStorage({
      clientId,
      content,
      documentName: documentTitle,
      documentType: DOCUMENT_TYPES.CUSTOM_DOCUMENT
    })

    return Response.json({
      ...result,
      documentId: result.document.id,
      promptName,
      message: 'Custom document saved successfully'
    })
  } catch (error) {
    console.error('Error saving custom document:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 