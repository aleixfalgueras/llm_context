import { DocumentService } from '@/lib/documents/service'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/middleware/api-middleware'
import { apiValidation } from '@/lib/utils/validation'

export const POST = withEnhancedApi(async ({ userId, req }) => {
  const { clientId, content, chatTitle } = await parseJsonBody(req)

  // Use centralized validation to eliminate duplicate validation patterns
  apiValidation.chatExport({ clientId, content, chatTitle })

  try {
    // Use the unified document service with tracking enabled
    const result = await DocumentService.createDocument(
      userId,
      clientId,
      chatTitle,
      DOCUMENT_TYPES.CHAT,
      content
    )

    return apiSuccess({
      ...result,
      documentId: result.document.id,
      message: 'Chat export saved successfully'
    }, 201)
  } catch (error) {
    // Check for storage limit errors
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      throw new Error(error.message) // Let enhanced middleware handle as standard error
    }
    throw error // Let enhanced middleware handle other errors
  }
}, {
  context: 'Save chat export',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
}) 