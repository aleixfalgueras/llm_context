import {openRouterService} from '@/services/openrouter'
import {logger} from '@/lib/logger'
import {DEFAULT_MODEL} from '@/lib/models-config'
import {ClientService} from '@/services/client/client-service'
import {DocumentService} from '@/services/document-service'
import {DocumentType} from '@prisma/client'
import {apiValidation} from '@/lib/utils/validation'
import {
  MeetingReportGenerationRequest,
  MeetingReportGenerationResponse,
  MeetingReportSaveRequest
} from '@/lib/types/ai-service-types'
import {unwrapResult} from '@/database/base-operations'

export class MeetingReportService {
  /**
   * Generate a meeting report using AI
   */
  static async generateReport(
    userId: string,
    request: MeetingReportGenerationRequest
  ): Promise<MeetingReportGenerationResponse> {
    const {
      clientId,
      meetingTranscription,
      meetingDate,
      additionalInfo,
      model: selectedModel = DEFAULT_MODEL
    } = request

    // Validate client access
    const clientResult = await ClientService.getUserClientById(clientId, userId)
    const client = unwrapResult(clientResult)

    // Log additional instructions if provided
    if (additionalInfo && additionalInfo.trim()) {
      logger.info(`Meeting Report - Additional Instructions provided: ${additionalInfo}`)
    }

    // Build the meeting report prompt
    const meetingReportPrompt = this.buildMeetingReportPrompt({
      clientName: client.name,
      meetingDate,
      meetingTranscription,
      additionalInfo
    })

    // Generate the report using OpenRouter
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

    return { report: meetingReport }
  }

  /**
   * Save a generated meeting report
   */
  static async saveReport(
    userId: string,
    request: MeetingReportSaveRequest
  ): Promise<{ documentId: string }> {
    const { clientId, meetingDate, reportContent, documentName } = request

    // Use centralized validation
    apiValidation.meetingReport({ clientId, meetingDate, reportContent })

    // Use the unified document service with tracking enabled
    const result = await DocumentService.createDocument(
      userId,
      clientId,
      documentName,
      DocumentType.meeting,
      reportContent
    )

    return { documentId: result.document.id }
  }

  /**
   * Build the meeting report prompt (always in English)
   */
  private static buildMeetingReportPrompt({
    clientName,
    meetingDate,
    meetingTranscription,
    additionalInfo
  }: {
    clientName: string
    meetingDate: string
    meetingTranscription: string
    additionalInfo?: string
  }): string {
    return `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${clientName}

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
  }
}