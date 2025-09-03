import { MeetingReportService } from '@/services/ai-services/meeting-report-service'
import { DEFAULT_MODEL } from '@/lib/models-config'
import { 
  withEnhancedApi, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'
import { getLocaleFromCookies } from '@/lib/utils/locale-cookie-server'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    // Parse request body
    const { clientId, meetingTranscription, meetingDate, additionalInfo, model: selectedModel = DEFAULT_MODEL } = await parseJsonBody(req)
    const locale = await getLocaleFromCookies()

    // Validate required fields
    if (!clientId || !meetingTranscription || !meetingDate) {
      throw new Error('Missing required fields: clientId, meetingTranscription, and meetingDate are required')
    }

    // Use the Meeting Report Service
    const data = await MeetingReportService.generateReport(userId, {
      clientId,
      meetingTranscription,
      meetingDate,
      additionalInfo,
      model: selectedModel,
      locale
    })

    return Response.json(data)
  },
  {
    context: 'Generate Meeting Report',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireUsageCheck: true
  }
) 