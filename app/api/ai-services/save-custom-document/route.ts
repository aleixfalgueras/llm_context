import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    // Check authentication only - no usage limits for documents
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Authentication required', { status: 401 })
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

    // Use the shared document save utility with tracking enabled
    const result = await saveDocumentToStorage({
      clientId,
      content,
      documentName: documentTitle,
      documentType: DOCUMENT_TYPES.CUSTOM_DOCUMENT,
      trackUsage: true // Explicitly enable usage tracking
    })

    return Response.json({
      ...result,
      documentId: result.document.id,
      promptName,
      message: 'Custom document saved successfully'
    })
  } catch (error) {
    console.error('Error saving custom document:', error)
    
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