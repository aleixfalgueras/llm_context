import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/api-middleware'
import { ApiErrors } from '@/lib/api-error-handler'
import { apiValidation } from '@/lib/validation-helpers'

export const POST = withEnhancedApi(async ({ req }) => {
  const { clientId, content, chatTitle } = await parseJsonBody(req)

  // Use centralized validation to eliminate duplicate validation patterns
  apiValidation.chatExport({ clientId, content, chatTitle })

  try {
    // Use the shared document save utility with tracking enabled
    const result = await saveDocumentToStorage({
      clientId,
      content,
      documentName: chatTitle,
      documentType: DOCUMENT_TYPES.CHAT,
      trackUsage: true // Explicitly enable usage tracking
    })

    return apiSuccess({
      ...result,
      documentId: result.document.id,
      message: 'Chat export saved successfully'
    }, 201)
  } catch (error) {
    // Check for storage limit errors
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      return ApiErrors.payloadTooLarge(error.message)
    }
    throw error // Let enhanced middleware handle other errors
  }
}, {
  context: 'Save chat export',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
}) 