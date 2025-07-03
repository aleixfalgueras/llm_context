import { saveDocumentToStorage } from '@/lib/document-save-utils'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/api-middleware'
import { ApiErrors } from '@/lib/api-error-handler'
import { apiValidation } from '@/lib/validation-helpers'

export const POST = withEnhancedApi(async ({ req }) => {
  const { clientId, meetingDate, reportContent, additionalInfo: _additionalInfo, documentName } = await parseJsonBody(req)

  // Use centralized validation to eliminate duplicate validation patterns
  apiValidation.meetingReport({ clientId, meetingDate, reportContent })

  try {
    // Use the shared document save utility with tracking enabled
    const result = await saveDocumentToStorage({
      clientId,
      content: reportContent,
      documentName,
      documentType: DOCUMENT_TYPES.MEETING,
      startDate: meetingDate,
      endDate: meetingDate,
      trackUsage: true // Explicitly enable usage tracking
    })

    return apiSuccess({
      ...result,
      documentId: result.document.id
    }, 201)
  } catch (error) {
    // Check for storage limit errors
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      throw new Error(error.message) // Let enhanced middleware handle as standard error
    }
    throw error // Let enhanced middleware handle other errors
  }
}, {
  context: 'Save meeting report',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
}) 