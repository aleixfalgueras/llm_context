'use server'

import {auth} from '@clerk/nextjs/server'
import {ChatService} from '@/services/chat-service'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

export async function deleteChat(chatId: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await ChatService.deleteChat(chatId, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete chat')
  }

  revalidatePath('/')
  redirect('/assistant')
}

export async function deleteAllChats(currentPath?: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await ChatService.deleteAllUserChats(userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete all chats')
  }

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

  const result = await ChatService.updateChatTitle(chatId, userId, title)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update chat title')
  }

  revalidatePath('/')
}