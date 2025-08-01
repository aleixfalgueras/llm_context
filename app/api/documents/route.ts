import { DocumentService } from '@/services/document-service'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// GET /api/documents - List user's documents
export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { searchParams } = req.nextUrl
    const clientId = searchParams.get('clientId')
    
    if (!clientId) {
      throw new Error('Client ID is required')
    }

    const documents = await DocumentService.getClientDocuments(userId, clientId)
    return apiSuccess(documents)
  },
  { 
    context: 'Get client documents',
    allowedMethods: ['GET']
  }
)

// POST /api/documents - Create new document
export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { clientId, documentName, documentType, content } = await parseJsonBody(req)

    if (!clientId || !documentName || !documentType || !content) {
      throw new Error('Missing required fields')
    }

    try {
      const result = await DocumentService.createDocument(
        userId,
        clientId,
        documentName,
        documentType,
        content
      )

      return apiSuccess(result, 201)
    } catch (error) {
      // Check for storage limit errors
      if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
        const storageError = new Error(error.message)
        ;(storageError as any).status = 413
        throw storageError
      }
      throw error
    }
  },
  { 
    context: 'Create document',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)