'use server'

import {auth} from '@clerk/nextjs/server'
import {prisma} from '../prisma'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

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