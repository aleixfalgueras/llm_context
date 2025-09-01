'use server'

import {ChatService} from '@/services/chat-service'
import {DocumentService} from '@/services/document-service'
import {checkAuth} from '@/lib/api/api-validation'
import {revalidatePath} from 'next/cache'
import {redirect, notFound} from 'next/navigation'
import {Chat, Message, DocumentType} from '@prisma/client'

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

  // Revalidate the assistant page to refresh the chats list
  revalidatePath('/assistant')

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

export async function exportChat(clientId: string | null, content: string, chatTitle: string) {
  const userId = await checkAuth()

  if (!content || !chatTitle) {
    throw new Error('Missing required fields: content and chatTitle are required')
  }

  try {
    const result = await DocumentService.createDocument(
      userId,
      clientId,
      chatTitle,
      DocumentType.chat,
      content
    )

    return {
      ...result,
      documentId: result.document.id,
      message: 'Chat export saved successfully'
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      throw new Error(error.message)
    }
    throw error
  }
}
