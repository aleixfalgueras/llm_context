import { CustomDocumentService } from '@/services/ai-services/custom-document-service'
import { ApiContext, parseJsonBody, withEnhancedApi } from '@/lib/api/api-middleware'
import { DEFAULT_MODEL } from '@/lib/models-config'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    // Parse request body
    const { 
      clientId, 
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = DEFAULT_MODEL
    } = await parseJsonBody(req)

    // Validate required fields
    if (!clientId || !customPrompt || !documentTitle) {
      throw new Error('Missing required fields: clientId, documentTitle, and customPrompt are required')
    }

    // Use the Custom Document Service
    const data = await CustomDocumentService.generateDocument(userId, {
      clientId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields,
      model: selectedModel
    })

    return Response.json(data)
  },
  {
    context: 'Generate Custom Document',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireUsageCheck: true
  }
) 