import { DocumentService } from '@/services/document-service'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// GET /api/documents/[id]/content - Get document content as JSON
export const GET = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const documentId = id as string

    const content = await DocumentService.getDocumentContent(userId, documentId)
    return apiSuccess({ content })
  },
  { 
    context: 'Get document content',
    allowedMethods: ['GET']
  }
)

