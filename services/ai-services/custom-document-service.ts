import {buildClientContextSection, replaceClientContextVariables} from '@/services/client/client-context-service'
import {openRouterService} from '@/services/openrouter'
import {DEFAULT_MODEL, getDefaultTemperature} from '@/lib/models-config'
import {getLanguageInstruction, getLanguageRequirementSection} from '@/lib/utils/language'
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

export class CustomDocumentService {

  /**
   * Generate a custom document using AI
   */
  static async generateDocument(
    userId: string,
    request: CustomDocumentGenerationRequest
  ): Promise<CustomDocumentGenerationResponse> {
    const {
      clientId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = DEFAULT_MODEL
    } = request

    // Validate client access
    const clientResult = await ClientService.getUserClientById(clientId, userId)
    const client = unwrapResult(clientResult)

    // Process the prompt with client context
    const processedData = this.processPromptWithContext({
      prompt: customPrompt,
      client,
      selectedContextFields,
      additionalInstructions
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
  private static processPromptWithContext({
    prompt,
    client,
    selectedContextFields,
    additionalInstructions
  }: {
    prompt: string
    client: any
    selectedContextFields: string[]
    additionalInstructions?: string
  }): ProcessedPromptData {
    // Replace client variables in prompt
    const processedPrompt = replaceClientContextVariables(prompt, client)

    // Get language instruction from client's documentsLanguage preference
    const targetLanguage = getLanguageInstruction(client.documentsLanguage || 'english')

    // Build client context section if fields are selected
    const clientContextSection = buildClientContextSection(client, selectedContextFields)

    // Create the complete prompt with client context section
    let completePrompt = processedPrompt

    if (clientContextSection) {
      completePrompt = `${processedPrompt}${clientContextSection}`
    }

    if (additionalInstructions) {
      completePrompt += `

ADDITIONAL INSTRUCTIONS:
${additionalInstructions}`
    }

    // Add language requirements
    completePrompt += `

${getLanguageRequirementSection(targetLanguage, 'custom-document')}

Please generate a professional, well-structured document based on the above prompt and client information. 

IMPORTANT: Generate the entire document in ${targetLanguage}, maintaining professional language and cultural appropriateness for this language.`

    return {
      completePrompt,
      client,
      targetLanguage
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