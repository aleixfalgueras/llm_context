import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions'
import { revalidatePath } from 'next/cache'
import { generateChatTitleWithClient } from '@/lib/utils'
import { buildChatSystemPrompt } from '@/lib/client-context-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, chatId, model } = await req.json()

    // CLIENT CONTEXT FLOW:
    // 1. Client context is ONLY added as system message on the FIRST user message
    // 2. Subsequent messages rely on conversation memory (no repeated context)
    // 3. This ensures optimal token usage and conversation flow

    // Get existing messages and chat info from the database
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
      return new Response('Chat not found', { status: 404 })
    }

    const existingMessages = chat.messages

    // Check if this is the first user message
    const isFirstUserMessage = existingMessages.length === 0

    // Format messages for OpenAI
    const openAIMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = existingMessages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // Get client information for this chat (required)
    const client = await prisma.client.findFirst({
      where: {
        id: (chat as any).clientId,
        userId,
      },
    })
    
    if (!client) {
      return new Response('Client not found', { status: 404 })
    }

    // Add system message with client context ONLY on first message
    if (isFirstUserMessage) {
      console.log(`[Chat ${chatId}] Adding client context system message (privacy-safe)`)
      
      const systemPrompt = buildChatSystemPrompt(client)

      openAIMessages.unshift({
        role: 'system',
        content: systemPrompt,
      })
    } else {
      console.log(`[Chat ${chatId}] Continuing conversation without client context (${existingMessages.length} previous messages)`)
    }

    // Add the new user message
    const lastMessage = messages[messages.length - 1]
    openAIMessages.push({
      role: 'user' as const,
      content: lastMessage.content,
    })

    // Use the model from the request, with fallback to environment variable or default
    const selectedModel = model || process.env.OPENAI_API_MODEL || 'gpt-4o'

    // Save the user message to the database
    await createMessage(chatId, lastMessage.content, 'USER', selectedModel)

    // If this is the first user message, update the chat title only if it's still the default
    if (isFirstUserMessage && chat.title === 'New Chat') {
      const newTitle = generateChatTitleWithClient(client.name)
      
      await prisma.chat.update({
        where: {
          id: chatId,
          userId,
        },
        data: {
          title: newTitle,
        },
      })
      
      // Revalidate the chat page and home page to show the updated title
      revalidatePath(`/assistant/chat/${chatId}`)
      revalidatePath('/')
    }

    // Get completion from OpenAI with configurable settings
    // All parameters can be customized via environment variables with validation
    const temperature = Math.max(0, Math.min(2, parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')))
    const maxTokens = Math.max(1, parseInt(process.env.OPENAI_MAX_TOKENS || '1000'))
    const presencePenalty = Math.max(-2, Math.min(2, parseFloat(process.env.OPENAI_PRESENCE_PENALTY || '0.1')))
    const frequencyPenalty = Math.max(-2, Math.min(2, parseFloat(process.env.OPENAI_FREQUENCY_PENALTY || '0.1')))

    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: openAIMessages,
      temperature,
      max_tokens: maxTokens,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
    })

    const assistantMessage = response.choices[0]?.message?.content || ''
    
    // Save the assistant's response to the database
    await createMessage(chatId, assistantMessage, 'ASSISTANT', selectedModel)

    // Only include newTitle if we actually updated it
    const shouldIncludeTitle = isFirstUserMessage && chat.title === 'New Chat'
    
    return Response.json({ 
      message: assistantMessage,
      ...(shouldIncludeTitle && { newTitle: generateChatTitleWithClient(client.name) })
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 