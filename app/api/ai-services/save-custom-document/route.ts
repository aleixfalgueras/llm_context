import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api-middleware'

export const POST = withEnhancedApi(
  async ({ req }: ApiContext) => {
    const body = await parseJsonBody(req)
    
    const { 
      clientId, 
      content, 
      documentTitle, 
      promptName
    } = body

    // Validate required fields
    if (!clientId || !content || !documentTitle) {
      throw new Error('Missing required fields: clientId, content, and documentTitle are required')
    }

    try {
      // Use the shared document save utility with tracking enabled
      const result = await saveDocumentToStorage({
        clientId,
        content,
        documentName: documentTitle,
        documentType: DOCUMENT_TYPES.CUSTOM_DOCUMENT,
        trackUsage: true // Explicitly enable usage tracking
      })

      return apiSuccess({
        ...result,
        documentId: result.document.id,
        promptName,
        message: 'Custom document saved successfully'
      })
    } catch (error) {
      // Check for storage limit errors
      if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
        throw new Error(`Storage limit exceeded: ${error.message}`)
      }
      throw error
    }
  },
  {
    context: 'Save Custom Document',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
) 