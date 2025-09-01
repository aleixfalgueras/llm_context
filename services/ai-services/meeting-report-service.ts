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

    // Get translated prompts
    const t = await getTranslations('aiPrompts', locale)
    const systemPrompt = t('meetingReport.systemPrompt')
    
    // Build the user prompt with task-specific data
    const userPrompt = await this.buildUserPrompt({
      clientName: client.name,
      meetingDate,
      meetingTranscription,
      additionalInfo,
      locale
    })

    // Generate the report using OpenRouter
    const completion = await openRouterService.createCompletion(
      {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
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
   * Build the user prompt with task-specific data
   */
  private static async buildUserPrompt({
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

    // Get the user prompt template and replace placeholders
    let userPrompt = t('meetingReport.userPromptTemplate')
    
    // Replace basic placeholders
    userPrompt = userPrompt.replace('{{clientName}}', clientName)
    userPrompt = userPrompt.replace('{{meetingDate}}', meetingDate)
    userPrompt = userPrompt.replace('{{meetingTranscription}}', meetingTranscription)
    
    // Handle additional info
    if (additionalInfo && additionalInfo.trim()) {
      const additionalInfoSection = t('meetingReport.additionalInfoSection')
        .replace('{{additionalInfo}}', additionalInfo)
      userPrompt = userPrompt.replace('{{additionalInfo}}', additionalInfoSection)
      
      const additionalAttentionText = t('meetingReport.additionalAttentionText')
      userPrompt = userPrompt.replace('{{additionalAttention}}', additionalAttentionText)
    } else {
      userPrompt = userPrompt.replace('{{additionalInfo}}', '')
      userPrompt = userPrompt.replace('{{additionalAttention}}', '')
    }
    
    return userPrompt
  }
}