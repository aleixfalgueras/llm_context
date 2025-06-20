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

    const { clientId, meetingTranscription, meetingDate, additionalInfo, language = 'english' } = await req.json()

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

    // Build the meeting report prompt
    const meetingReportPrompt = `You are a professional AI assistant helping a coach/consultant generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${client.name}

MEETING INFORMATION:
- Meeting Date: ${meetingDate}
- Meeting Transcription:
${meetingTranscription}${additionalInfo ? `

ADDITIONAL CONTEXT:
${additionalInfo}` : ''}

${getLanguageRequirementSection(targetLanguage, 'meeting')}

INSTRUCTIONS:
- Create a comprehensive meeting report based on the transcription provided
- Focus on documenting the meeting content objectively and professionally
- Structure the report in a clear, professional format with the following sections:
  1. Meeting Summary
  2. Key Discussion Points
  3. Outcomes & Decisions
  4. Action Items & Next Steps
  5. Follow-up Requirements
- Include specific, actionable steps with clear timelines where applicable
- Base recommendations solely on what was discussed in the meeting${additionalInfo ? `
- Pay special attention to the additional context provided above` : ''}
- Provide the response in markdown format for easy reading
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
          content: meetingReportPrompt
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