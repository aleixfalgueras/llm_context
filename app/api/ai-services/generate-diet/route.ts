import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, startDate, endDate, dailyCalories, proteinTarget, additionalInfo, includeClientGoals = true, formatDocumentId } = await req.json()

    if (!clientId || !startDate || !endDate) {
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

    // Fetch format document content if provided
    let formatDocumentContent = ''
    if (formatDocumentId) {
      try {
        const formatDocument = await prisma.document.findFirst({
          where: {
            id: formatDocumentId,
            userId,
            clientId
          }
        })
        
        if (formatDocument) {
          // Import the getDocumentContent function
          const { getDocumentContent } = await import('@/lib/document-actions')
          formatDocumentContent = await getDocumentContent(formatDocument.documentPath)
        }
      } catch (error) {
        console.error('Error fetching format document:', error)
        // Continue without format document rather than failing
      }
    }

    // Build the client context prompt (same as chat system)
    const clientContextPrompt = `You are a professional AI assistant helping a coach/consultant with their client. You have access to the following client information and should use it to provide personalized, relevant advice and responses.

CLIENT PROFILE:${client.dateOfBirth ? `
Age: ${Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old` : ''}${client.height ? `
Height: ${client.height}cm` : ''}${client.weight ? `
Weight: ${client.weight}kg` : ''}${client.country ? `
Country: ${client.country}` : ''}${includeClientGoals && client.goals ? `

GOALS:
${client.goals}` : ''}${client.medicalHistory ? `

MEDICAL HISTORY:
${client.medicalHistory}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

DIET GENERATION REQUEST:
- Start Date: ${startDate}
- End Date: ${endDate}
- Duration: ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days${dailyCalories ? `

NUTRITIONAL TARGETS:
- Daily Calories: ${dailyCalories} kcal${proteinTarget ? `
- Daily Protein: ${proteinTarget}g` : ''}` : proteinTarget ? `

NUTRITIONAL TARGETS:
- Daily Protein: ${proteinTarget}g` : ''}${additionalInfo ? `

ADDITIONAL INFORMATION:
${additionalInfo}` : ''}${formatDocumentContent ? `

FORMAT EXAMPLE DOCUMENT:
Please use the following document as a format and structure example for the new diet plan:

---
${formatDocumentContent}
---` : ''}

INSTRUCTIONS:
- Create a comprehensive, personalized diet plan for this client
- Use the client's profile information to tailor recommendations${formatDocumentContent ? `
- Follow the format, structure, and presentation style from the provided format example document` : ''}
- Structure the diet plan in a clear, professional format
- Include meal plans, portion recommendations, and nutritional guidance
- Consider their${includeClientGoals && client.goals ? ' goals,' : ''} medical history, and personal circumstances${(dailyCalories || proteinTarget) ? `
- Adhere to the specified nutritional targets above` : ''}${additionalInfo ? `
- Pay special attention to the additional information provided above` : ''}
- Provide the response in markdown format for easy reading
- DO NOT include any suggestions about consulting healthcare professionals
- DO NOT include any disclaimers or OpenAI-related content
- Provide ONLY the diet plan content in a delivery-ready format
- Make it actionable and specific to this client's needs`

    // Generate the diet plan
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: clientContextPrompt
        },
        {
          role: 'user',
          content: `Please create a detailed diet plan for this client covering the specified date range. Make it personalized based on their profile information.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const dietPlan = response.choices[0]?.message?.content || ''
    
    if (!dietPlan) {
      return new Response('Failed to generate diet plan', { status: 500 })
    }

    return Response.json({ diet: dietPlan })
  } catch (error) {
    console.error('Error generating diet:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 