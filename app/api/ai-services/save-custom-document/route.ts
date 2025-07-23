import { DocumentService } from '@/lib/documents/service'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
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
      // Use the unified document service with tracking enabled
      const result = await DocumentService.createDocument(
        userId,
        clientId,
        documentTitle,
        DOCUMENT_TYPES.CUSTOM_DOCUMENT,
        content
      )

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