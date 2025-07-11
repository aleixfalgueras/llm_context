'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '../prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateChatTitleWithClient } from '../utils/general'
import { logger, withTiming } from '../logger'

export async function createChat(title: string = 'New Chat', clientId: string, contextFields: string[] = []) {
  const endTiming = logger.startTiming('Create Chat Action');
  
  try {
  const { userId } = await auth()
  
  if (!userId) {
      logger.warn('Unauthorized attempt to create chat');
    throw new Error('Unauthorized')
  }

  if (!clientId) {
      logger.warn('Chat creation attempted without client ID', { userId });
    throw new Error('Client selection is required')
  }

    logger.userAction('Create new chat', { 
      userId, 
      clientId,
      metadata: { title, contextFieldCount: contextFields.length }
    });

  // Get client name to create a meaningful title
    logger.dbQuery('findFirst', 'client', { userId, clientId });
  const client = await prisma.client.findFirst({
    where: { 
      id: clientId,
      userId 
    },
    select: { name: true }
  })

  if (!client) {
      logger.warn('Client not found for chat creation', { userId, clientId });
    throw new Error('Client not found')
  }

  // Use client name in title if title is the default
  const chatTitle = title === 'New Chat' ? generateChatTitleWithClient(client.name) : title

    logger.dbQuery('create', 'chat', { userId, clientId });
    const chat = await withTiming(
      'Create chat in DB',
      () => prisma.chat.create({
    data: {
      title: chatTitle,
      userId,
      clientId,
      contextFields,
    } as any,
      }),
      { userId, clientId }
    );

  revalidatePath('/')
    endTiming();
  redirect(`/assistant/chat/${chat.id}`)
  } catch (error) {
    logger.error('Error creating chat', error as Error, { userId: 'unknown', clientId });
    endTiming();
    throw error;
  }
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
  redirect('/assistant')
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
  if (currentPath && currentPath.startsWith('/assistant/chat/')) {
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