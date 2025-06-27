import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions'
import { revalidatePath } from 'next/cache'
import { generateChatTitleWithClient } from '@/lib/utils'
import { buildClientContextSection, hasClientContext } from '@/lib/client-context-utils'
import { withClientAccess } from '@/lib/client-middleware'
import { createAICompletionStream } from '@/lib/ai-wrapper'
import { AIProviderError } from '@/lib/ai-errors'
import { logger } from '@/lib/logger'
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

    // Authentication check only - no conversation limits, token limits will be enforced by AI wrapper
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

    // Format messages for AI provider
    const aiMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = existingMessages.map((msg: any) => ({
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

      // Log the complete system prompt for the first message
      logger.info('System prompt created for chat', { 
        userId, 
        chatId, 
        clientId: client.id,
        metadata: { 
          systemPrompt,
          promptLength: systemPrompt.length,
          hasClientContext: hasContext,
          contextFields: selectedContextFields,
          clientName: client.name
        }
      });

      aiMessages.unshift({
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
    aiMessages.push({
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

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullContent = ''
        
        try {
          // Use unified AI wrapper with automatic usage tracking (streaming version)
          logger.aiRequest(selectedModel, undefined, { userId, chatId });
          
          const completionStream = createAICompletionStream(
            {
              model: selectedModel,
              messages: aiMessages
            },
            {
              userId,
              eventType: 'document_generation', // Track as document generation since it's content creation
              resourceId: chatId
            }
          );

          for await (const chunk of completionStream) {
            if (chunk.isComplete) {
              // Final chunk - save the complete message to database
              logger.info('AI response received', { 
                userId, 
                chatId, 
                model: selectedModel,
                metadata: { 
                  responseLength: fullContent.length,
                  tokensUsed: chunk.usage?.totalTokens 
                }
              });
              
              // Save the assistant's response to the database
              logger.dbQuery('create', 'message', { userId, chatId });
              await createMessage(chatId, fullContent, 'ASSISTANT', selectedModel)
              logger.info('Assistant message saved', { userId, chatId });

              // Send completion signal
              const completionData = {
                type: 'complete',
                newTitle: isFirstUserMessage && chat.title === 'New Chat' ? generateChatTitleWithClient(client.name) : undefined
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(completionData)}\n\n`))
              
              controller.close()
            } else if (chunk.content) {
              // Stream content chunk
              fullContent += chunk.content
              const data = {
                type: 'content',
                content: chunk.content
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }
          }
        } catch (error) {
          logger.error('Error in streaming chat', error as Error, { chatId });
          
          // Handle AI provider errors specifically
          if (error instanceof AIProviderError) {
            const errorData = {
              type: 'error',
              error: error.message,
              provider: error.provider,
              errorType: error.type,
              retryAfter: error.retryAfter
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
          } else {
            const errorData = {
              type: 'error',
              error: 'Internal Server Error'
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
          }
          
          controller.close()
        }
      }
    })

    logger.apiResponse('POST', '/api/chat', 200, { 
      userId, 
      chatId,
      metadata: { 
        streaming: true
      }
    });
    
    endTiming();
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    logger.error('Error in chat API', error as Error, { chatId });
    logger.apiResponse('POST', '/api/chat', 500, { chatId });
    endTiming();
    
    // Handle AI provider errors specifically
    if (error instanceof AIProviderError) {
      return Response.json(
        {
          error: error.message,
          provider: error.provider,
          type: error.type,
          retryAfter: error.retryAfter
        },
        { status: error.statusCode || 500 }
      )
    }
    
    return new Response('Internal Server Error', { status: 500 })
  }
} 