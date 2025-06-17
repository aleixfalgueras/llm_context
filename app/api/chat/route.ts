import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { createMessage } from '@/lib/actions'
import { revalidatePath } from 'next/cache'
import { generateChatTitle } from '@/lib/utils'

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

    // Check if this is the first user message
    const isFirstUserMessage = existingMessages.length === 0

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

    // If this is the first user message, update the chat title
    if (isFirstUserMessage) {
      const newTitle = generateChatTitle(lastMessage.content)
      
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
      revalidatePath(`/chat/${chatId}`)
      revalidatePath('/')
    }

    // Get completion from OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL as string,
      messages: openAIMessages,
    })

    const assistantMessage = response.choices[0]?.message?.content || ''
    
    // Save the assistant's response to the database
    await createMessage(chatId, assistantMessage, 'ASSISTANT')

    return Response.json({ 
      message: assistantMessage,
      ...(isFirstUserMessage && { newTitle: generateChatTitle(lastMessage.content) })
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 