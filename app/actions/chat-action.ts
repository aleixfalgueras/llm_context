'use server'

import {ChatService} from '@/services/chat/chat-service'
import {DocumentService} from '@/services/document-service'
import {checkAuth} from '@/lib/api/api-validation'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {Chat, DocumentType, Role} from '@prisma/client'
import {ChatWithMessages} from "@/lib/types/chat-types"
import {MessageService} from '@/services/chat/message-service'

export async function getChats(): Promise<Chat[]> {
  const userId = await checkAuth()
  const result = await ChatService.getUserChats(userId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch chats')
  }

  return result.data
}

export async function getChatWithMessagesById(chatId: string): Promise<ChatWithMessages> {
  const userId = await checkAuth()
  return await ChatService.getChatWithMessagesById(chatId, userId)
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

export async function regenerateMessage(chatId: string) {
  const userId = await checkAuth()

  // Get chat with messages
  const chat = await ChatService.getChatWithMessagesById(chatId, userId)

  // Find last assistant message
  const lastAssistantMessage = [...chat.messages]
    .reverse()
    .find(msg => msg.role === Role.ASSISTANT)

  if (!lastAssistantMessage) {
    throw new Error('No assistant message found to regenerate')
  }

  // Find the user message that prompted this assistant response
  const lastAssistantIndex = chat.messages.findIndex(msg => msg.id === lastAssistantMessage.id)
  const previousUserMessage = [...chat.messages.slice(0, lastAssistantIndex)]
    .reverse()
    .find(msg => msg.role === Role.USER)

  if (!previousUserMessage) {
    throw new Error('No user message found before assistant message')
  }

  // Mark the last assistant message as inactive
  const result = await MessageService.markMessageAsInactive(lastAssistantMessage.id, userId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to mark message as inactive')
  }

  // Revalidate the chat page
  revalidatePath(`/assistant/chat/${chatId}`)

  // Return the user message content to resend
  return {
    userMessageContent: previousUserMessage.content
  }
}
