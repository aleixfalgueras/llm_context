'use server'

import {ChatService} from '@/services/chat-service'
import {checkAuth} from '@/lib/api/api-validation'
import {revalidatePath} from 'next/cache'
import {redirect, notFound} from 'next/navigation'
import {Chat, Message} from '@prisma/client'

export async function getChats(): Promise<Chat[]> {
  const userId = await checkAuth()
  const result = await ChatService.getUserChats(userId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch chats')
  }

  return result.data
}

export async function getChatWithMessagesById(chatId: string): Promise<Chat & { messages: Message[] }> {
  const userId = await checkAuth()
  const result = await ChatService.getChatWithMessagesById(chatId, userId)

  if (!result.success) {
    notFound()
  }

  return result.data
}

export async function deleteChat(chatId: string) {
  const userId = await checkAuth()

  const result = await ChatService.deleteChat(chatId, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete chat')
  }

  redirect('/assistant')
}

export async function deleteAllChats(currentPath?: string) {
  const userId = await checkAuth()

  const result = await ChatService.deleteAllUserChats(userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete all chats')
  }

  // If user is currently viewing a chat page, redirect to assistant page
  if (currentPath && currentPath.startsWith('/assistant/chat/')) {
    redirect('/assistant')
  }
}

export async function updateChatTitle(chatId: string, title: string) {
  const userId = await checkAuth()

  const result = await ChatService.updateChatTitle(chatId, userId, title)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update chat title')
  }

  revalidatePath(`/assistant/chat/${chatId}`)
}
