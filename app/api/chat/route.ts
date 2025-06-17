import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, chatId } = await req.json()

    // Get existing messages from the database
    const existingMessages = await prisma.message.findMany({
      where: {
        chatId,
        chat: {
          userId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Format messages for OpenAI
    const openAIMessages = existingMessages.map((msg: any) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // Add the new user message
    const lastMessage = messages[messages.length - 1]
    openAIMessages.push({
      role: 'user' as const,
      content: lastMessage.content,
    })

    // Save the user message to the database
    await createMessage(chatId, lastMessage.content, 'USER')

    // Get completion from OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL as string,
      messages: openAIMessages,
    })

    const assistantMessage = response.choices[0]?.message?.content || ''
    
    // Save the assistant's response to the database
    await createMessage(chatId, assistantMessage, 'ASSISTANT')

    return Response.json({ message: assistantMessage })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 