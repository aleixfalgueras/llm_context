import { CustomDocumentService } from '@/services/ai-services/custom-document-service'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'

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

    // Use the Custom Document Service
    const data = await CustomDocumentService.saveDocument(userId, {
      clientId,
      content,
      documentTitle,
      promptName
    })

    return apiSuccess({
      documentId: data.documentId,
      promptName,
      message: data.message
    })
  },
  {
    context: 'Save Custom Document',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
) 