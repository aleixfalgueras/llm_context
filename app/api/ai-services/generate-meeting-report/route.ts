// Language utilities removed - meeting reports are now generated in English only
import { openRouterService } from '@/services/openrouter'
import { logger, withTiming } from '@/lib/logger'
import { DEFAULT_MODEL } from '@/lib/models-config'
import { ClientService } from '@/services/client/client-service'
import { 
  withEnhancedApi, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    // Parse request body
    const { clientId, meetingTranscription, meetingDate, additionalInfo, model: selectedModel = DEFAULT_MODEL } = await parseJsonBody(req)


    // Validate required fields
    if (!clientId || !meetingTranscription || !meetingDate) {
      throw new Error('Missing required fields: clientId, meetingTranscription, and meetingDate are required')
    }

    const clientResult = await ClientService.getUserClientById(clientId, userId)
    if (!clientResult.success) {
      throw new Error(clientResult.error || 'Client not found')
    }
    const client = clientResult.data

    // Log additional instructions if provided
    if (additionalInfo && additionalInfo.trim()) {
      logger.info(`Meeting Report - Additional Instructions provided: ${additionalInfo}`);
    }

    // Build the meeting report prompt (always in English)
    const meetingReportPrompt = `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${client.name}

MEETING INFORMATION:
- Meeting Date: ${meetingDate}
- Meeting Transcription:
${meetingTranscription}${additionalInfo ? `

ADDITIONAL INFORMATION:
${additionalInfo}` : ''}

INSTRUCTIONS:
- Create a comprehensive meeting report based on the transcription provided
- Focus on documenting the meeting content objectively and professionally
- Structure the report in a clear, professional format with the following sections:
  1. Meeting Summary
  2. Key Discussion Points
  3. Outcomes & Decisions
  4. Action Items & Next Steps
  5. Follow-up Requirements
- Include specific, actionable steps with clear timelines where applicable
- Base recommendations solely on what was discussed in the meeting${additionalInfo ? `
- Pay special attention to the additional information provided above` : ''}
- DO NOT include any disclaimers or AI provider-related content
- Provide ONLY the meeting report content in a delivery-ready format
- Make the action items specific, measurable, and achievable
- Focus on practical next steps that can be implemented immediately
- Generate the response in English with clear, professional language`

    // Use OpenRouter service with automatic usage tracking
    const completion = await openRouterService.createCompletion(
      {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: meetingReportPrompt
          },
          {
            role: 'user',
            content: `Please create a detailed meeting report based on the transcription provided. Focus on creating actionable insights and clear next steps for this client.`
          }
        ],
        temperature: 0.7,
      },
      {
        userId: userId,
        resourceId: clientId,
        additionalMetadata: {
          documentType: 'meeting-report'
        }
      }
    )

    const meetingReport = completion.content
    
    if (!meetingReport) {
      throw new Error('Failed to generate meeting report')
    }

    return Response.json({ report: meetingReport })
  },
  {
    context: 'Generate Meeting Report',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireToken: true
  }
) 