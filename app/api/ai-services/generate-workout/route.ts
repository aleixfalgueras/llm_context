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

    const { clientId, startDate, endDate, workoutType, fitnessLevel, daysPerWeek, sessionDuration, equipment, additionalInfo, includeClientGoals = true, formatDocumentId } = await req.json()

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

    // Build the client context prompt
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

WORKOUT PLAN REQUEST:
- Start Date: ${startDate}
- End Date: ${endDate}
- Duration: ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days${workoutType ? `

WORKOUT SPECIFICATIONS:
- Workout Type: ${workoutType}` : ''}${fitnessLevel ? `
- Fitness Level: ${fitnessLevel}` : ''}${daysPerWeek ? `
- Days Per Week: ${daysPerWeek}` : ''}${sessionDuration ? `
- Session Duration: ${sessionDuration} minutes` : ''}${equipment ? `
- Available Equipment: ${equipment}` : ''}${additionalInfo ? `

ADDITIONAL INFORMATION:
${additionalInfo}` : ''}${formatDocumentContent ? `

FORMAT EXAMPLE DOCUMENT:
Please use the following document as a format and structure example for the new workout plan:

---
${formatDocumentContent}
---` : ''}

INSTRUCTIONS:
- Create a comprehensive, personalized workout plan for this client
- Use the client's profile information to tailor recommendations${formatDocumentContent ? `
- Follow the format, structure, and presentation style from the provided format example document` : ''}
- Structure the workout plan in a clear, professional format
- Include exercise descriptions, sets, reps, and progression guidelines
- Consider their${includeClientGoals && client.goals ? ' goals,' : ''} medical history, fitness level, and personal circumstances
- Include warm-up and cool-down routines
- Provide exercise modifications or alternatives when appropriate${equipment ? `
- Use only the specified available equipment` : ''}${additionalInfo ? `
- Pay special attention to the additional information provided above` : ''}
- Provide the response in markdown format for easy reading
- DO NOT include any suggestions about consulting healthcare professionals
- DO NOT include any disclaimers or OpenAI-related content
- Provide ONLY the workout plan content in a delivery-ready format
- Make it actionable and specific to this client's needs`

    // Generate the workout plan
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: clientContextPrompt
        },
        {
          role: 'user',
          content: `Please create a detailed workout plan for this client covering the specified date range. Make it personalized based on their profile information and workout specifications.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const workoutPlan = response.choices[0]?.message?.content || ''
    
    if (!workoutPlan) {
      return new Response('Failed to generate workout plan', { status: 500 })
    }

    return Response.json({ workout: workoutPlan })
  } catch (error) {
    console.error('Error generating workout:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 