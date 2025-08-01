// Language utilities removed - meeting reports are now generated in English only
import { createAICompletion } from '@/lib/ai/wrapper'
import { logger, withTiming } from '@/lib/logger'
import { DEFAULT_MODEL } from '@/lib/ai/models-config'
import { handleApiError } from '@/lib/api/api-error-handler'
import {withAuth, withClientAccess, withTokenValidation} from "@/lib/middleware/validation-middleware";

export async function POST(req: Request) {
  const endTiming = logger.startTiming('Generate Meeting Report API');
  let clientId: string = '';
  let userId: string = '';
  
  try {
    // Use composable middleware for auth and token validation first
    userId = await withAuth()
    await withTokenValidation(userId)

    // Parse request body after authentication
    const { clientId: requestClientId, meetingTranscription, meetingDate, additionalInfo, model: selectedModel = DEFAULT_MODEL } = await req.json()
    clientId = requestClientId;
    logger.apiRequest('POST', '/api/ai-services/generate-meeting-report', { clientId });

    // Validate client access after parsing clientId
    const client = await withClientAccess(userId, clientId)

    // Log additional instructions if provided
    if (additionalInfo && additionalInfo.trim()) {
      logger.info(`Meeting Report - Additional Instructions provided: ${additionalInfo}`);
    }

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

    // Build the meeting report prompt (always in English)
    const meetingReportPrompt = `You are a professional AI assistant helping a marketing professional generate a comprehensive meeting report with actionable steps. Focus on documenting what happened during the meeting and creating clear next steps.

CLIENT: ${client.name}

MEETING INFORMATION:
- Meeting Date: ${meetingDate}
- Meeting Transcription:
${meetingTranscription}${additionalInfo ? `

ADDITIONAL INFORMATION:
${additionalInfo}` : ''}

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
- Pay special attention to the additional information provided above` : ''}
- DO NOT include any disclaimers or AI provider-related content
- Provide ONLY the meeting report content in a delivery-ready format
- Make the action items specific, measurable, and achievable
- Focus on practical next steps that can be implemented immediately
- Generate the response in English with clear, professional language`

    // Use unified AI wrapper with automatic usage tracking
    logger.aiRequest(selectedModel, undefined, { userId: userId, clientId });
    
    const completion = await withTiming(
      'AI Meeting Report Generation',
      () => createAICompletion(
        {
          model: selectedModel,
        messages: [
          {
            role: 'system',
            content: meetingReportPrompt
          },
          {
            role: 'user',
            content: `Please create a detailed meeting report based on the transcription provided. Focus on creating actionable insights and clear next steps for this client.`
          }
        ],
        temperature: 0.7,
      },
      {
        userId: userId,
        resourceId: clientId,
        additionalMetadata: {
          documentType: 'meeting-report'
        }
      }
      ),
      { userId: userId, clientId, model: selectedModel }
    );

    const meetingReport = completion.content
    
    if (!meetingReport) {
      logger.error('Failed to generate meeting report - empty response', undefined, { 
        userId: userId, 
        clientId 
      });
      return new Response('Failed to generate meeting report', { status: 500 })
    }



    logger.apiResponse('POST', '/api/ai-services/generate-meeting-report', 200, { 
      userId: userId, 
      clientId 
    });
    endTiming();
    return Response.json({ report: meetingReport })
  } catch (error) {
    return handleApiError(error, {
      context: 'generate meeting report',
      userId,
      resourceId: clientId,
      operation: 'generate-meeting-report',
      cleanup: () => {
        logger.apiResponse('POST', '/api/ai-services/generate-meeting-report', 500, { clientId });
        endTiming();
      }
    });
  }
} 