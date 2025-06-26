import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions'
import { revalidatePath } from 'next/cache'
import { generateChatTitleWithClient } from '@/lib/utils'
import { buildClientContextSection, hasClientContext } from '@/lib/client-context-utils'
import { withAuthAndUsageCheck } from '@/lib/api-middleware'
import { withClientAccess } from '@/lib/client-middleware'
import { createAICompletion } from '@/lib/ai-wrapper'
import { logger, createRequestContext, withTiming } from '@/lib/logger'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getDefaultModel } from '@/lib/models-config'

export async function POST(req: Request) {
  const endTiming = logger.startTiming('Chat API');
  let chatId: string = '';
  
  try {
    const { messages, chatId: requestChatId, model } = await req.json()
    chatId = requestChatId;
    logger.apiRequest('POST', '/api/chat', { chatId, model });

    // Authentication check only - no conversation limits, token limits will be enforced by OpenAI wrapper
    const { userId } = await auth()
    if (!userId) {
      logger.warn('Authentication failed', { chatId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    logger.info('Chat request authenticated', { userId, chatId, model });

    // CLIENT CONTEXT FLOW:
    // 1. Client context is ONLY added as system message on the FIRST user message
    // 2. Subsequent messages rely on conversation memory (no repeated context)
    // 3. This ensures optimal token usage and conversation flow

    // Get existing messages and chat info from the database
    logger.dbQuery('findFirst', 'chat', { userId, chatId });
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!chat) {
      logger.warn('Chat not found', { userId, chatId });
      return new Response('Chat not found', { status: 404 })
    }

    logger.info('Chat data retrieved', { 
      userId, 
      chatId,
      clientId: chat.clientId,
      metadata: { messageCount: chat.messages.length }
    });

    const existingMessages = chat.messages

    // Check if this is the first user message
    const isFirstUserMessage = existingMessages.length === 0

    // Format messages for OpenAI
    const openAIMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = existingMessages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // Get client information for this chat (required)
    const clientAccess = await withClientAccess(userId, (chat as any).clientId)
    if (!clientAccess.success) {
      return clientAccess.response!
    }
    
    const client = clientAccess.client!

    // Add system message with client context ONLY on first message
    if (isFirstUserMessage) {
      logger.info('Adding client context system message', { 
        userId, 
        chatId, 
        clientId: client.id,
        metadata: { 
          clientName: client.name,
          selectedContextFields: (chat as any).contextFields || []
        }
      });
      
      // Build chat system prompt with user-selected client context
      const selectedContextFields = (chat as any).contextFields || []
      const clientContextSection = buildClientContextSection(client, selectedContextFields)
      const hasContext = hasClientContext(selectedContextFields)
      
      const systemPrompt = `You are a professional AI assistant helping a marketing service provider with their business.${hasContext ? ' You have access to the following client information and should use it to provide personalized, relevant advice and responses.' : ''}${clientContextSection}

INSTRUCTIONS:
- ${hasContext ? 'Use this client information to personalize your responses when relevant' : 'Provide helpful general business advice'}
- ${hasContext ? 'Reference their specific circumstances when it adds value to your response' : 'Keep responses broadly applicable but actionable'}
- Be professional, knowledgeable, and supportive
- Help with any aspect of marketing business operations: strategy, client management, content creation, campaigns, analysis, operations, industry insights, problem-solving, etc.
- Provide practical, actionable advice tailored to marketing professionals
- Maintain confidentiality and professionalism at all times

Respond naturally and conversationally while keeping this context in mind.`

      openAIMessages.unshift({
        role: 'system',
        content: systemPrompt,
      })
    } else {
      logger.info('Continuing conversation without client context', { 
        userId, 
        chatId,
        metadata: { previousMessageCount: existingMessages.length }
      });
    }

    // Add the new user message
    const lastMessage = messages[messages.length - 1]
    openAIMessages.push({
      role: 'user' as const,
      content: lastMessage.content,
    })

    // Use the model from the request, with fallback to centralized default
    const selectedModel = model || getDefaultModel()

    // Save the user message to the database
    logger.dbQuery('create', 'message', { userId, chatId });
    await createMessage(chatId, lastMessage.content, 'USER', selectedModel)
    logger.info('User message saved', { 
      userId, 
      chatId, 
      model: selectedModel,
      metadata: { messageLength: lastMessage.content.length }
    });

    // If this is the first user message, update the chat title only if it's still the default
    if (isFirstUserMessage && chat.title === 'New Chat') {
      const newTitle = generateChatTitleWithClient(client.name)
      
      logger.dbQuery('update', 'chat', { userId, chatId });
      await prisma.chat.update({
        where: {
          id: chatId,
          userId,
        },
        data: {
          title: newTitle,
        },
      })
      
      logger.info('Chat title updated', { 
        userId, 
        chatId,
        metadata: { newTitle }
      });
      
      // Revalidate the chat page and home page to show the updated title
      revalidatePath(`/assistant/chat/${chatId}`)
      revalidatePath('/')
    }

    // Use unified OpenAI wrapper with automatic usage tracking (token and cost limits enforced automatically)
    logger.aiRequest(selectedModel, undefined, { userId, chatId });
    const completion = await withTiming(
      'AI API Call',
      () => createAICompletion(
      {
        model: selectedModel,
        messages: openAIMessages
      },
      {
        userId,
        eventType: 'document_generation', // Track as document generation since it's content creation
        resourceId: chatId
      }
      ),
      { userId, chatId, model: selectedModel },
      3000 // AI API calls can take longer - warn if >3 seconds
    );

    const assistantMessage = completion.content
    logger.info('AI response received', { 
      userId, 
      chatId, 
      model: selectedModel,
      metadata: { 
        responseLength: assistantMessage.length,
        tokensUsed: completion.usage?.totalTokens 
      }
    });
    
    // Save the assistant's response to the database
    logger.dbQuery('create', 'message', { userId, chatId });
    await createMessage(chatId, assistantMessage, 'ASSISTANT', selectedModel)
    logger.info('Assistant message saved', { userId, chatId });

    // Only include newTitle if we actually updated it
    const shouldIncludeTitle = isFirstUserMessage && chat.title === 'New Chat'
    
    const response = { 
      message: assistantMessage,
      ...(shouldIncludeTitle && { newTitle: generateChatTitleWithClient(client.name) })
    };
    
    logger.apiResponse('POST', '/api/chat', 200, { 
      userId, 
      chatId,
      metadata: { 
        responseLength: assistantMessage.length,
        includedTitle: shouldIncludeTitle
      }
    });
    
    endTiming();
    return Response.json(response);
  } catch (error) {
    logger.error('Error in chat API', error as Error, { chatId });
    logger.apiResponse('POST', '/api/chat', 500, { chatId });
    endTiming();
    return new Response('Internal Server Error', { status: 500 })
  }
} 