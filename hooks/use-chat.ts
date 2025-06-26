'use client'

import { useState, useEffect } from 'react'
import { clientLogger, withClientTiming } from '@/lib/client-logger'
import { useToast } from '@/hooks/use-toast'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai-errors'

interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
}

export function useChat(chatId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [onTitleUpdate, setOnTitleUpdate] = useState<((title: string) => void) | null>(null)
  const { toast } = useToast()

  // Update messages when initialMessages changes (for server-side updates)
  useEffect(() => {
    setMessages(initialMessages)
    clientLogger.info('Chat messages updated', { 
      chatId,
      metadata: { messageCount: initialMessages.length }
    });
  }, [initialMessages, chatId])

  useEffect(() => {
    clientLogger.componentMount('useChat', { chatId });
    return () => {
      clientLogger.componentUnmount('useChat', { chatId });
    };
  }, [chatId])

  const sendMessage = async (content: string, selectedModel?: string) => {
    if (!content.trim() || isLoading) {
      clientLogger.warn('Message send attempted with empty content or while loading', { 
        chatId,
        metadata: { hasContent: !!content.trim(), isLoading }
      });
      return;
    }

    const endTiming = clientLogger.startTiming('Send Message', { chatId });
    clientLogger.messageSent(content.length, selectedModel, { chatId });

    setIsLoading(true)
    setInput('')

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'USER',
      createdAt: new Date(),
    }

    // Immediately add user message to UI
    setMessages(prev => [...prev, userMessage])
    clientLogger.debug('User message added to UI', { 
      chatId,
      metadata: { messageId: userMessage.id }
    });

    try {
      clientLogger.apiCall('POST', '/api/chat', { chatId });
      
      const response = await withClientTiming(
        'Chat API Request',
        () => fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ content }],
          chatId,
          model: selectedModel || 'gpt-4o-mini', // Default to gpt-4o-mini if no model specified
        }),
        }),
        { chatId }
      );

      clientLogger.apiResponse('POST', '/api/chat', response.status, { chatId });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        // Handle AI provider errors from API
        if (errorData?.error && errorData?.provider) {
          const aiError = new AIProviderError(
            errorData.error,
            errorData.provider,
            errorData.type || 'unknown',
            response.status,
            errorData.retryAfter
          )
          throw aiError
        }
        
        throw new Error(errorData?.error || `Failed to send message: ${response.status}`)
      }

      const data = await response.json()
      clientLogger.messageReceived(data.message.length, { chatId });
      
      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        role: 'ASSISTANT',
        createdAt: new Date(),
      }

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage])
      clientLogger.debug('Assistant message added to UI', { 
        chatId,
        metadata: { messageId: assistantMessage.id }
      });
      
      // Update title if this was the first message
      if (data.newTitle && onTitleUpdate) {
        onTitleUpdate(data.newTitle)
        clientLogger.info('Chat title updated', { 
          chatId,
          metadata: { newTitle: data.newTitle }
        });
      }
      
    } catch (error) {
      clientLogger.error('Error sending message', error as Error, { chatId });
      
      // Handle AI provider errors with specific messages
      if (error instanceof AIProviderError) {
        const { title, description } = getAIErrorMessage(error)
        toast({
          title,
          description,
          variant: 'destructive',
          duration: error.type === 'rate_limit' ? 10000 : 8000, // Longer duration for rate limits
        })
      } else {
        // Generic error handling
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.'
        toast({
          title: 'Message Failed',
          description: errorMessage,
          variant: 'destructive',
        })
      }
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      clientLogger.debug('User message removed due to error', { 
        chatId,
        metadata: { messageId: userMessage.id }
      });
    } finally {
      setIsLoading(false)
      endTiming();
    }
  }

  return {
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    setOnTitleUpdate,
  }
} 