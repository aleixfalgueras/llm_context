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
import {getTranslations, Locale} from '@/lib/translations'


export class MeetingReportService {
  /**
   * Generate a meeting report using AI
   */
  static async generateReport(
    userId: string,
    request: MeetingReportGenerationRequest & { locale?: Locale }
  ): Promise<MeetingReportGenerationResponse> {
    const {
      clientId,
      meetingTranscription,
      meetingDate,
      additionalInfo,
      model: selectedModel = DEFAULT_MODEL,
      locale = 'en'
    } = request

    // Validate client access
    const clientResult = await ClientService.getUserClientById(clientId, userId)
    const client = unwrapResult(clientResult)

    // Log additional instructions if provided
    if (additionalInfo && additionalInfo.trim()) {
      logger.info(`Meeting Report - Additional Instructions provided: ${additionalInfo}`)
    }

    // Build the meeting report prompt
    const meetingReportPrompt = await this.buildMeetingReportPrompt({
      clientName: client.name,
      meetingDate,
      meetingTranscription,
      additionalInfo,
      locale
    })
    
    // Get translated user prompt
    const t = await getTranslations('aiPrompts', locale)
    const userPrompt = t('meetingReport.userPrompt')

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
            content: userPrompt
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
   * Build the meeting report prompt with localized text
   */
  private static async buildMeetingReportPrompt({
    clientName,
    meetingDate,
    meetingTranscription,
    additionalInfo,
    locale = 'en'
  }: {
    clientName: string
    meetingDate: string
    meetingTranscription: string
    additionalInfo?: string
    locale?: Locale
  }): Promise<string> {
    const t = await getTranslations('aiPrompts', locale)

    const systemPrompt = t('meetingReport.systemPrompt')
    const clientInfo = t('meetingReport.clientInfo', { clientName })
    const meetingInfo = t('meetingReport.meetingInfo', { meetingDate })
    const additionalInfoLabel = t('meetingReport.additionalInfo')
    const instructions = t('meetingReport.instructions')
    const additionalAttention = additionalInfo ? t('meetingReport.additionalAttention') : ''
    const deliveryFormat = t('meetingReport.deliveryFormat')

    return `${systemPrompt}

${clientInfo}

${meetingInfo}
${meetingTranscription}${additionalInfo ? `

${additionalInfoLabel}
${additionalInfo}` : ''}

${instructions}${additionalAttention ? `
${additionalAttention}` : ''}
${deliveryFormat}`
  }
}