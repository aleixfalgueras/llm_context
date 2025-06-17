'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createChat(title: string = 'New Chat') {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const chat = await prisma.chat.create({
    data: {
      title,
      userId,
    },
  })

  revalidatePath('/')
  redirect(`/chat/${chat.id}`)
}

export async function deleteChat(chatId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  await prisma.chat.delete({
    where: {
      id: chatId,
      userId, // Ensure user can only delete their own chats
    },
  })

  revalidatePath('/')
  redirect('/')
}

export async function updateChatTitle(chatId: string, title: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  await prisma.chat.update({
    where: {
      id: chatId,
      userId,
    },
    data: {
      title,
    },
  })

  revalidatePath('/')
}

export async function createMessage(chatId: string, content: string, role: 'USER' | 'ASSISTANT') {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify the chat belongs to the user
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  })

  if (!chat) {
    throw new Error('Chat not found')
  }

  const message = await prisma.message.create({
    data: {
      content,
      role,
      chatId,
    },
  })

  revalidatePath(`/chat/${chatId}`)
  return message
}

export async function addUsedNoteToChat(chatId: string, noteName: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Verify the chat belongs to the user
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  })

  if (!chat) {
    throw new Error('Chat not found')
  }

  try {
    // Add note to usedNotes if it's not already there
    const currentUsedNotes = (chat as any).usedNotes || []
    if (!currentUsedNotes.includes(noteName)) {
      await prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          usedNotes: {
            push: noteName,
          },
        } as any,
      })
    }
  } catch (error) {
    console.error('Error updating used notes:', error)
    // Continue without failing - this is a nice-to-have feature
  }

  revalidatePath(`/chat/${chatId}`)
} 