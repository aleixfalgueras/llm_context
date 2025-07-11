'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '../prisma'
import { revalidatePath } from 'next/cache'
import { logger, withTiming } from '../logger'

export async function createMessage(
  chatId: string, 
  content: string, 
  role: 'USER' | 'ASSISTANT', 
  model?: string, 
  tokensUsed?: number,
  inputTokens?: number,
  outputTokens?: number
) {
  const endTiming = logger.startTiming('Create Message Action');
  
  try {
  const { userId } = await auth()
  
  if (!userId) {
      logger.warn('Unauthorized attempt to create message');
    throw new Error('Unauthorized')
  }

    logger.userAction('Create message', { 
      userId, 
      chatId,
      metadata: { role, contentLength: content.length, model, tokensUsed, inputTokens, outputTokens }
    });

  // Verify the chat belongs to the user
    logger.dbQuery('findFirst', 'chat', { userId, chatId });
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
    },
  })

  if (!chat) {
      logger.warn('Chat not found for message creation', { userId, chatId });
    throw new Error('Chat not found')
  }

    logger.dbQuery('create', 'message', { userId, chatId });
    const message = await withTiming(
      'Create message in DB',
      () => prisma.message.create({
    data: {
      content,
      role,
      model,
      tokensUsed: tokensUsed || 0,
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      chatId,
    },
      }),
      { userId, chatId }
    );

  revalidatePath(`/assistant/chat/${chatId}`)
    endTiming();
  return message
  } catch (error) {
    logger.error('Error creating message', error as Error, { userId: 'unknown', chatId });
    endTiming();
    throw error;
  }
}