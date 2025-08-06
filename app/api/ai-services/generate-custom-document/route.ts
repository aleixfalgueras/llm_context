import { prisma } from '@/lib/prisma'
import {buildClientContextSection, replaceClientContextVariables} from '@/services/client/client-context-service'
import { openRouterService } from '@/services/openrouter'
import { getDefaultTemperature, DEFAULT_MODEL } from '@/lib/models-config'
import { getLanguageInstruction, getLanguageRequirementSection } from '@/lib/utils/language'
import { logger } from '@/lib/logger'
import { ClientService } from '@/services/client/client-service'
import { 
  withEnhancedApi, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    // Parse request body
    const { 
      clientId, 
      promptId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = DEFAULT_MODEL
    } = await parseJsonBody(req)


    // Validate required fields
    if (!clientId || (!promptId && !customPrompt) || !documentTitle) {
      throw new Error('Missing required fields: clientId, documentTitle, and either promptId or customPrompt are required')
    }

    // Validate client access after parsing clientId
    const clientResult = await ClientService.getUserClientById(clientId, userId)
    if (!clientResult.success) {
      throw new Error(clientResult.error || 'Client not found')
    }
    const client = clientResult.data

    // Get prompt content
    let promptContent = ''
    let promptName = 'Custom Document'

    if (promptId) {
      // Use existing prompt
      const prompt = await prisma.prompt.findFirst({
        where: {
          id: promptId,
          userId: userId,
          isActive: true,
        },
      })

      if (!prompt) {
        throw new Error('Prompt not found')
      }

      promptContent = prompt.content
      promptName = prompt.name

      // Track prompt usage
      await prisma.prompt.update({
        where: { id: promptId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      })
    } else {
      // Use custom prompt provided in request
      promptContent = customPrompt
    }

    // Replace client variables in prompt using shared utility
    const processedPrompt = replaceClientContextVariables(promptContent, client)

    // Get language instruction from client's documentsLanguage preference
    const targetLanguage = getLanguageInstruction(client.documentsLanguage || 'english')

    // Build client context section if fields are selected - RESPECTS user privacy choices
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

    // Log the prompt used for document generation
    logger.info('🤖 Custom Document Generation - Prompt Used', {
      userId: userId,
      clientId,
      operation: 'custom-document-generation',
      model: selectedModel,
      metadata: {
        promptName,
        documentTitle,
        clientName: client.name,
        targetLanguage,
        hasCustomPrompt: !!customPrompt,
        hasAdditionalInstructions: !!additionalInstructions,
        selectedContextFields,
        promptLength: completePrompt.length,
        prompt: completePrompt
      }
    })

    // Use OpenRouter service with automatic usage tracking
    const completion = await openRouterService.createCompletion(
      {
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: completePrompt,
          },
        ],
        temperature: getDefaultTemperature(),
      },
      {
        userId: userId,
        resourceId: clientId,
        additionalMetadata: {
          documentType: 'custom-document',
          promptName
        }
      }
    )

    const generatedContent = completion.content

    if (!generatedContent) {
      throw new Error('Failed to generate document')
    }

    return Response.json({
      content: generatedContent,
      promptName,
      clientName: client.name,
      documentTitle,
    })
  },
  {
    context: 'Generate Custom Document',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireToken: true
  }
) 