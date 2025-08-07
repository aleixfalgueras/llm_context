'use server'

import { revalidatePath } from 'next/cache'
import { PromptService } from '@/services/prompt-service'
import { checkAuth } from '@/lib/api/api-validation'
import { Prompt } from '@prisma/client'
import { PromptListFilters } from '@/services/prompt-service'

export async function getPrompts(filters: PromptListFilters = {}): Promise<Prompt[]> {
  const userId = await checkAuth()
  const result = await PromptService.getUserPrompts(userId, filters)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch prompts')
  }

  return result.data
}

export async function getPromptById(promptId: string): Promise<Prompt> {
  const userId = await checkAuth()
  const result = await PromptService.getPromptById(promptId, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch prompt')
  }

  return result.data
}

export async function createPrompt(data: {
  name: string
  description?: string
  content: string
  category?: string
}): Promise<Prompt> {
  const userId = await checkAuth()
  const result = await PromptService.createPrompt(userId, data)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create prompt')
  }

  revalidatePath('/prompts')
  return result.data
}

export async function updatePrompt(promptId: string, data: {
  name?: string
  description?: string
  content?: string
  category?: string
  isActive?: boolean
}): Promise<Prompt> {
  const userId = await checkAuth()
  const result = await PromptService.updatePrompt(promptId, userId, data)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update prompt')
  }

  revalidatePath('/prompts')
  return result.data
}

export async function deletePrompt(promptId: string): Promise<void> {
  const userId = await checkAuth()
  const result = await PromptService.deletePrompt(promptId, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete prompt')
  }

  revalidatePath('/prompts')
}

export async function trackPromptUsage(promptId: string): Promise<void> {
  const userId = await checkAuth()
  const result = await PromptService.trackPromptUsage(promptId, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to track prompt usage')
  }

  revalidatePath('/prompts')
}