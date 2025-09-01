import {buildClientContextSection, replaceClientContextVariables} from '@/services/client/client-context-service'
import {openRouterService} from '@/services/openrouter'
import {DEFAULT_MODEL, getDefaultTemperature} from '@/lib/models-config'
import {logger} from '@/lib/logger'
import {ClientService} from '@/services/client/client-service'
import {DocumentService} from '@/services/document-service'
import {DocumentType} from '@prisma/client'
import {
  CustomDocumentGenerationRequest,
  CustomDocumentGenerationResponse,
  CustomDocumentSaveRequest,
  DocumentGenerationContext,
  ProcessedPromptData
} from '@/lib/types/ai-service-types'
import {unwrapResult} from '@/database/base-operations'
import {getTranslations, Locale} from '@/lib/translations'


export class CustomDocumentService {
  /**
   * Generate a custom document using AI
   */
  static async generateDocument(
    userId: string,
    request: CustomDocumentGenerationRequest & { locale?: Locale }
  ): Promise<CustomDocumentGenerationResponse> {
    const {
      clientId,
      prompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = DEFAULT_MODEL,
      locale = 'en'
    } = request

    // Validate client access
    const clientResult = await ClientService.getUserClientById(clientId, userId)
    const client = unwrapResult(clientResult)

    // Process the prompt with client context
    const processedData = await this.processPromptWithContext({
      prompt,
      client,
      selectedContextFields,
      additionalInstructions,
      locale
    })

    // Create generation context for logging
    const context: DocumentGenerationContext = {
      userId,
      clientId,
      promptName: 'Custom Document',
      documentTitle
    }

    // Log the generation request
    this.logDocumentGeneration(context, selectedModel, processedData, additionalInstructions)

    // Generate the document using OpenRouter
    const completion = await openRouterService.createCompletion(
      {
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: processedData.completePrompt,
          },
        ],
        temperature: getDefaultTemperature(),
      },
      {
        userId: userId,
        resourceId: clientId,
        additionalMetadata: {
          documentType: 'custom-document',
          promptName: context.promptName
        }
      }
    )

    const generatedContent = completion.content
    if (!generatedContent) {
      throw new Error('Failed to generate document')
    }

    return {
      content: generatedContent,
      promptName: context.promptName,
      clientName: client.name,
      documentTitle,
    }
  }

  /**
   * Save a generated custom document
   */
  static async saveDocument(
    userId: string,
    request: CustomDocumentSaveRequest
  ): Promise<{ documentId: string; message: string }> {
    const { clientId, content, documentTitle, promptName } = request

    // Use the unified document service with tracking enabled
    const result = await DocumentService.createDocument(
      userId,
      clientId,
      documentTitle,
      DocumentType.custom_document,
      content
    )

    return {
      documentId: result.document.id,
      message: 'Custom document saved successfully'
    }
  }

  /**
   * Process prompt with client context and additional instructions
   */
  private static async processPromptWithContext({
    prompt,
    client,
    selectedContextFields,
    additionalInstructions,
    locale = 'en'
  }: {
    prompt: string
    client: any
    selectedContextFields: string[]
    additionalInstructions?: string
    locale?: Locale
  }): Promise<ProcessedPromptData> {
    // Replace client variables in prompt and trim
    const processedPrompt = replaceClientContextVariables(prompt.trim(), client)

    // Build client context section if fields are selected
    const tContext = await getTranslations('clientContext', locale)
    const tPrompts = await getTranslations('aiPrompts', locale)
    const tLanguages = await getTranslations('languages', locale)
    const clientContextSection = buildClientContextSection(client, selectedContextFields, tContext)

    // Create the complete prompt with client context section
    let completePrompt = processedPrompt
    if (clientContextSection) {
      completePrompt = `
${processedPrompt}

${clientContextSection}`.trim()
    }

    if (additionalInstructions) {
      const additionalInstructionsLabel = tPrompts('documents.additionalInstructions')
      completePrompt += `

${additionalInstructionsLabel}
${additionalInstructions}`
    }

    // Add language requirements
    const targetLanguageCode = client.documentsLanguage || 'en'
    const languageName = tLanguages(targetLanguageCode)

    // Use translated document generation instructions
    const instructions = tPrompts('documents.generation.instructions')
    const outputFormat = tPrompts('documents.generation.outputFormat')
    const languageRequirements = tPrompts('documents.generation.languageRequirements', { languageName })
    const rememberLanguage = tPrompts('documents.generation.rememberLanguage', { languageName })

    completePrompt += `
---
${instructions}

${outputFormat}

${languageRequirements}

${rememberLanguage}`

    return {
      completePrompt,
      client,
      targetLanguage: targetLanguageCode
    }
  }

  /**
   * Log document generation for debugging and monitoring
   */
  private static logDocumentGeneration(
    context: DocumentGenerationContext,
    selectedModel: string,
    processedData: ProcessedPromptData,
    additionalInstructions?: string
  ): void {
    logger.info('🤖 Custom Document Generation - Prompt Used', {
      userId: context.userId,
      clientId: context.clientId,
      operation: 'custom-document-generation',
      model: selectedModel,
      metadata: {
        promptName: context.promptName,
        documentTitle: context.documentTitle,
        clientName: processedData.client.name,
        targetLanguage: processedData.targetLanguage,
        hasAdditionalInstructions: !!additionalInstructions,
        promptLength: processedData.completePrompt.length,
        prompt: processedData.completePrompt
      }
    })
  }
}