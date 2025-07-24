'use server'

import { auth } from '@clerk/nextjs/server'
import { MessageService } from '../services/message-service'
import { revalidatePath } from 'next/cache'

export async function createMessage(
  chatId: string, 
  content: string, 
  role: 'USER' | 'ASSISTANT', 
  model?: string, 
  tokensUsed?: number,
  inputTokens?: number,
  outputTokens?: number
) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await MessageService.createMessage(
    chatId, 
    userId, 
    content, 
    role, 
    model, 
    tokensUsed, 
    inputTokens, 
    outputTokens
  )

  if (!result.success) {
    throw new Error(result.error || 'Failed to create message')
  }

  revalidatePath(`/assistant/chat/${chatId}`)
  return (result as { success: true; data: any }).data
}