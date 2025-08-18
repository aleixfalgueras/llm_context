import { MeetingReportService } from '@/services/ai-services/meeting-report-service'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/api/api-middleware'

export const POST = withEnhancedApi(async ({ userId, req }) => {
  const { clientId, meetingDate, reportContent, additionalInfo, documentName } = await parseJsonBody(req)

  // Use the Meeting Report Service
  const data = await MeetingReportService.saveReport(userId, {
    clientId,
    meetingDate,
    reportContent,
    documentName,
    additionalInfo
  })

  return apiSuccess({
    documentId: data.documentId
  }, 201)
}, {
  context: 'Save meeting report',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
}) 