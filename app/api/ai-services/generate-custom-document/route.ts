import { prisma } from '@/lib/prisma'
import { buildClientContext } from '@/lib/client-context-utils'
import { replaceClientVariables } from '@/lib/variable-replacement'
import { withAuthUsageAndClient } from '@/lib/client-middleware'
import { createAICompletion } from '@/lib/ai-wrapper'
import { getDefaultTemperature, getDefaultMaxTokens } from '@/lib/models-config'
import { getLanguageInstruction, getLanguageRequirementSection } from '@/lib/language-utils'

export async function POST(request: Request) {
  try {
    const { 
      clientId, 
      promptId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = [],
      model: selectedModel = 'gpt-4o-mini'
    } = await request.json()

    // Validate required fields
    if (!clientId || (!promptId && !customPrompt) || !documentTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use unified middleware for auth, usage, and client access
    const middleware = await withAuthUsageAndClient('document', clientId)
    if (!middleware.success) {
      return middleware.response!
    }
    
    const { userId, client } = middleware
    const validUserId = userId!
    const validClient = client!

    // Get prompt content
    let promptContent = ''
    let promptName = 'Custom Document'

    if (promptId) {
      // Use existing prompt
      const prompt = await prisma.prompt.findFirst({
        where: {
          id: promptId,
          userId: validUserId,
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
    const processedPrompt = replaceClientVariables(promptContent, validClient)

    // Get language instruction from client's documentsLanguage preference
    const targetLanguage = getLanguageInstruction(validClient.documentsLanguage || 'english')

    // Build client context if fields are selected
    const clientContext = buildClientContext(validClient, selectedContextFields)

    // Create the complete prompt
    let completePrompt = processedPrompt

    if (clientContext) {
      completePrompt = `${processedPrompt}

CLIENT CONTEXT:
${clientContext}`
    }

    if (additionalInstructions) {
      completePrompt += `

ADDITIONAL INSTRUCTIONS:
${additionalInstructions}`
    }

    // Add language requirements
    completePrompt += `

${getLanguageRequirementSection(targetLanguage, 'custom-document')}

Please generate a professional, well-structured document based on the above prompt and client information. Format the content in clear markdown with appropriate headings, sections, and formatting for easy reading and professional presentation. 

IMPORTANT: Generate the entire document in ${targetLanguage}, maintaining professional language and cultural appropriateness for this language.`

    // Use unified OpenAI wrapper with automatic usage tracking
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
        max_tokens: getDefaultMaxTokens(true), // Use AI Services default (2000 tokens)
      },
      {
        userId: validUserId,
        eventType: 'document_generation',
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
      clientName: validClient.name,
      documentTitle,
    })
  } catch (error) {
    console.error('Error generating custom document:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 