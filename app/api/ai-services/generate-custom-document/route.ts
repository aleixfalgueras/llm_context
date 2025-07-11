import { prisma } from '@/lib/prisma'
import { buildClientContextSection } from '@/lib/utils/client-context'
import { replaceClientVariables } from '@/lib/ai/variable-replacement'
import { withAuth, withTokenValidation, withClientAccess } from '@/lib/middleware/api-middleware'
import { createAICompletion } from '@/lib/ai/wrapper'
import { AIProviderError } from '@/lib/ai/errors'
import { getDefaultTemperature, DEFAULT_MODEL } from '@/lib/ai/models-config'
import { getLanguageInstruction, getLanguageRequirementSection } from '@/lib/utils/language'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/middleware/error-handler'

export async function POST(request: Request) {
  let userId: string = '';
  
  try {
    // Use composable middleware for auth and token validation first
    userId = await withAuth()
    await withTokenValidation(userId)

    // Parse request body after authentication
    const { 
      clientId, 
      promptId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = DEFAULT_MODEL
    } = await request.json()

    // Validate client access after parsing clientId
    const client = await withClientAccess(userId, clientId)

    // Validate required fields
    if (!clientId || (!promptId && !customPrompt) || !documentTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

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
        return new Response('Prompt not found', { status: 404 })
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
    const processedPrompt = replaceClientVariables(promptContent, client)

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

    // Use unified AI wrapper with automatic usage tracking
    const completion = await createAICompletion(
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
      return new Response('Failed to generate document', { status: 500 })
    }

    return Response.json({
      content: generatedContent,
      promptName,
      clientName: client.name,
      documentTitle,
    })
  } catch (error) {
    return handleApiError(error, {
      context: 'generate custom document',
      userId,
      operation: 'generate-custom-document'
    });
  }
} 