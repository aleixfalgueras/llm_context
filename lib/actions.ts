'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateChatTitleWithClient } from './utils'

export async function createChat(title: string = 'New Chat', clientId: string, contextFields: string[] = []) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  if (!clientId) {
    throw new Error('Client selection is required')
  }

  // Get client name to create a meaningful title
  const client = await prisma.client.findFirst({
    where: { 
      id: clientId,
      userId 
    },
    select: { name: true }
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Use client name in title if title is the default
  const chatTitle = title === 'New Chat' ? generateChatTitleWithClient(client.name) : title

  const chat = await prisma.chat.create({
    data: {
      title: chatTitle,
      userId,
      clientId,
      contextFields,
    } as any,
  })

  revalidatePath('/')
  redirect(`/chat/${chat.id}`)
}

export async function createChatAndReturn(title: string = 'New Chat', clientId: string, contextFields: string[] = []) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  if (!clientId) {
    throw new Error('Client selection is required')
  }

  // Get client name to create a meaningful title
  const client = await prisma.client.findFirst({
    where: { 
      id: clientId,
      userId 
    },
    select: { name: true }
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Use client name in title if title is the default
  const chatTitle = title === 'New Chat' ? generateChatTitleWithClient(client.name) : title

  const chat = await prisma.chat.create({
    data: {
      title: chatTitle,
      userId,
      clientId,
      contextFields,
    } as any,
  })

  revalidatePath('/')
  return chat.id
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

export async function deleteAllChats(currentPath?: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  await prisma.chat.deleteMany({
    where: {
      userId, // Only delete the user's own chats
    },
  })

  revalidatePath('/')
  
  // If user is currently viewing a chat page, redirect to assistant page
  if (currentPath && currentPath.startsWith('/chat/')) {
    redirect('/assistant')
  }
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

 