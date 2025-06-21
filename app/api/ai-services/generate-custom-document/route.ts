import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { buildClientContext } from '@/lib/client-context-utils'
import { replaceClientVariables } from '@/lib/variable-replacement'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { 
      clientId, 
      promptId,
      customPrompt,
      documentTitle,
      additionalInstructions,
      selectedContextFields = []
    } = await request.json()

    // Validate required fields
    if (!clientId || (!promptId && !customPrompt) || !documentTitle) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Get client information
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })

    if (!client) {
      return new Response('Client not found', { status: 404 })
    }

    // Get prompt content
    let promptContent = ''
    let promptName = 'Custom Document'

    if (promptId) {
      // Use existing prompt
      const prompt = await prisma.prompt.findFirst({
        where: {
          id: promptId,
          userId,
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

    // Build client context if fields are selected
    const clientContext = buildClientContext(client, selectedContextFields)

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

    completePrompt += `

Please generate a professional, well-structured document based on the above prompt and client information. Format the content in clear markdown with appropriate headings, sections, and formatting for easy reading and professional presentation.`

    // Generate document with OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: completePrompt,
        },
      ],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    })

    const generatedContent = response.choices[0]?.message?.content || ''

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
    console.error('Error generating custom document:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 