import { getLanguageInstruction, getLanguageRequirementSection } from '@/lib/language-utils'
import { withAuthUsageAndClient } from '@/lib/client-middleware'
import { createOpenAICompletion } from '@/lib/openai-wrapper'
import { logger, createRequestContext, withTiming } from '@/lib/logger'

export async function POST(req: Request) {
  const endTiming = logger.startTiming('Generate Meeting Report API');
  let clientId: string = '';
  
  try {
    const { clientId: requestClientId, meetingTranscription, meetingDate, additionalInfo, language = 'english' } = await req.json()
    clientId = requestClientId;
    logger.apiRequest('POST', '/api/ai-services/generate-meeting-report', { clientId });

    if (!clientId || !meetingTranscription || !meetingDate) {
      logger.warn('Missing required fields for meeting report', { 
        clientId,
        metadata: { 
          hasClientId: !!clientId, 
          hasTranscription: !!meetingTranscription,
          hasMeetingDate: !!meetingDate
        }
      });
      return new Response('Missing required fields', { status: 400 })
    }



    // Use unified middleware for auth, usage, and client access
    const middleware = await withAuthUsageAndClient('document', clientId)
    if (!middleware.success) {
      logger.warn('Auth, usage, or client access failed', { clientId });
      return middleware.response!
    }
    
    const { userId, client } = middleware
    
    // TypeScript assertion - middleware guarantees these exist
    const validUserId = userId!
    const validClient = client!



    // Get language instruction
    const targetLanguage = getLanguageInstruction(language)

    // Build the meeting report prompt
    const meetingReportPrompt = `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${validClient.name}

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

    // Use unified OpenAI wrapper with automatic usage tracking
    const model = process.env.OPENAI_API_MODEL || 'gpt-4o-mini';
    logger.aiRequest(model, undefined, { userId: validUserId, clientId });
    
    const completion = await withTiming(
      'OpenAI Meeting Report Generation',
      () => createOpenAICompletion(
        {
          model,
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
      },
      {
        userId: validUserId,
        eventType: 'document_generation',
        resourceId: clientId,
        additionalMetadata: {
          documentType: 'meeting-report'
        }
      }
      ),
      { userId: validUserId, clientId, model }
    );

    const meetingReport = completion.content
    
    if (!meetingReport) {
      logger.error('Failed to generate meeting report - empty response', undefined, { 
        userId: validUserId, 
        clientId 
      });
      return new Response('Failed to generate meeting report', { status: 500 })
    }



    logger.apiResponse('POST', '/api/ai-services/generate-meeting-report', 200, { 
      userId: validUserId, 
      clientId 
    });
    endTiming();
    return Response.json({ report: meetingReport })
  } catch (error) {
    logger.error('Error generating meeting report', error as Error, { clientId });
    logger.apiResponse('POST', '/api/ai-services/generate-meeting-report', 500, { clientId });
    endTiming();
    return new Response('Internal Server Error', { status: 500 })
  }
} 