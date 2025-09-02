import { CustomDocumentService } from '@/services/ai-services/custom-document-service'
import { ApiContext, parseJsonBody, withEnhancedApi } from '@/lib/api/api-middleware'
import { DEFAULT_MODEL } from '@/lib/models-config'
import { getLocaleFromCookies } from '@/lib/utils/locale-cookie-server'

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
    const locale = await getLocaleFromCookies()

    // Validate required fields
    if (!clientId || !customPrompt || !documentTitle) {
      throw new Error('Missing required fields: clientId, documentTitle, and customPrompt are required')
    }

    // Use the Custom Document Service
    const data = await CustomDocumentService.generateDocument(userId, {
      clientId,
      prompt: customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields,
      model: selectedModel,
      locale
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