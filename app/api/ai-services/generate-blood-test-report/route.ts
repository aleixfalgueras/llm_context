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

    const { clientId, testDate, additionalInfo, extractedData } = await req.json()

    if (!clientId || !extractedData) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Use extracted date if available, otherwise fall back to provided date
    const finalTestDate = extractedData.testInfo?.testDate || testDate

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

    // Build client context similar to other AI services
    const clientAge = client.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null

    const clientContextPrompt = `You are a professional health analyst helping a coach/consultant analyze their client's blood test results. You have access to the following client information and extracted blood test data.

CLIENT PROFILE:${clientAge ? `
Age: ${clientAge} years old` : ''}${client.height ? `
Height: ${client.height}cm` : ''}${client.weight ? `
Weight: ${client.weight}kg` : ''}${client.country ? `
Country: ${client.country}` : ''}${client.medicalHistory ? `

MEDICAL HISTORY:
${client.medicalHistory}` : ''}${client.notes ? `

ADDITIONAL NOTES:
${client.notes}` : ''}

BLOOD TEST INFORMATION:
- Test Date: ${finalTestDate}${extractedData.testInfo?.labName ? `
- Laboratory: ${extractedData.testInfo.labName}` : ''}${extractedData.testInfo?.doctorName ? `
- Doctor: ${extractedData.testInfo.doctorName}` : ''}

EXTRACTED BLOOD TEST PARAMETERS:
${JSON.stringify(extractedData.parameters, null, 2)}

INSTRUCTIONS:
Create a comprehensive blood test analysis report that includes:

1. **Executive Summary**: Overall health status and key findings
2. **Parameter Analysis**: Detailed analysis of each parameter, especially those outside normal ranges
3. **Health Insights**: What the results indicate about the client's health
4. **Risk Assessment**: Any potential health risks or concerns identified
5. **Recommendations**: 
   - Lifestyle modifications
   - Dietary suggestions
   - Exercise recommendations
   - Follow-up testing if needed
6. **Action Plan**: Specific, actionable steps the client should take

IMPORTANT GUIDELINES:
- Use the client's profile information to personalize recommendations
- Consider their medical history and current health status
- Focus on practical, actionable advice
- Highlight any abnormal values and explain their significance
- Provide context for why certain parameters matter
- Structure the report in a clear, professional format using markdown
- DO NOT provide medical diagnoses or treatment recommendations
- DO NOT suggest specific medications
- Always recommend consulting healthcare professionals for medical concerns
- Make recommendations appropriate for a fitness/wellness coaching context
- Base recommendations purely on health optimization, not specific fitness goals

Provide the response in markdown format for easy reading and professional presentation.`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: clientContextPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3,
      })

      const report = response.choices[0]?.message?.content

      if (!report) {
        throw new Error('No response generated')
      }

      return Response.json({ 
        success: true, 
        report 
      })

    } catch (error) {
      console.error('OpenAI error:', error)
      throw new Error('Failed to generate blood test report')
    }

  } catch (error) {
    console.error('Blood test report generation error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    )
  }
} 