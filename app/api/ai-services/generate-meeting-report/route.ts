import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getLanguageInstruction, getLanguageRequirementSection } from '@/lib/language-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { clientId, meetingTranscription, meetingDate, additionalInfo, includeClientContext = true, language = 'english' } = await req.json()

    if (!clientId || !meetingTranscription || !meetingDate) {
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

    // Get language instruction
    const targetLanguage = getLanguageInstruction(language)

    // Build the client context prompt (same as chat system)
    const clientContextPrompt = `You are a professional AI assistant helping a coach/consultant generate a comprehensive meeting report with actionable steps. You have access to the following client information and should use it to provide personalized, relevant analysis and recommendations.

CLIENT PROFILE:${client.dateOfBirth ? `
Age: ${Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old` : ''}${client.height ? `
Height: ${client.height}cm` : ''}${client.weight ? `
Weight: ${client.weight}kg` : ''}${client.country ? `
Country: ${client.country}` : ''}${includeClientContext && client.goals ? `

GOALS:
${client.goals}` : ''}${client.medicalHistory ? `

MEDICAL HISTORY:
${client.medicalHistory}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

MEETING INFORMATION:
- Meeting Date: ${meetingDate}
- Meeting Transcription:
${meetingTranscription}${additionalInfo ? `

ADDITIONAL CONTEXT:
${additionalInfo}` : ''}

${getLanguageRequirementSection(targetLanguage, 'meeting')}

INSTRUCTIONS:
- Create a comprehensive meeting report based on the transcription provided
- Use the client's profile information to provide personalized context and insights
- Structure the report in a clear, professional format with the following sections:
  1. Meeting Summary
  2. Key Discussion Points
  3. Client Progress & Updates
  4. Action Items & Next Steps
  5. Recommendations
- Include specific, actionable steps with clear timelines where applicable
- Consider the client's${includeClientContext && client.goals ? ' goals,' : ''} medical history, and personal circumstances when making recommendations${additionalInfo ? `
- Pay special attention to the additional context provided above` : ''}
- Provide the response in markdown format for easy reading
- DO NOT include any suggestions about consulting healthcare professionals unless specifically relevant to the discussion
- DO NOT include any disclaimers or OpenAI-related content
- Provide ONLY the meeting report content in a delivery-ready format
- Make the action items specific, measurable, and achievable
- Focus on practical next steps that can be implemented immediately
- IMPORTANT: Write the entire response in ${targetLanguage}, including all headings, summaries, and action items`

    // Generate the meeting report
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: clientContextPrompt
        },
        {
          role: 'user',
          content: `Please create a detailed meeting report based on the transcription provided. Focus on creating actionable insights and clear next steps for this client. Generate the complete response in ${targetLanguage}.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const meetingReport = response.choices[0]?.message?.content || ''
    
    if (!meetingReport) {
      return new Response('Failed to generate meeting report', { status: 500 })
    }

    return Response.json({ report: meetingReport })
  } catch (error) {
    console.error('Error generating meeting report:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 