'use client'

import { useState, useEffect, useRef } from 'react'
import { clientLogger, withClientTiming } from '@/lib/client-logger'
import { useToast } from '@/hooks/use-toast'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai-errors'
import { DEFAULT_MODEL } from '@/lib/models-config'

interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
  isStreaming?: boolean // Add flag for streaming messages
}

export function useChat(chatId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [onTitleUpdate, setOnTitleUpdate] = useState<((title: string) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
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

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      
      // Mark any streaming message as complete
      setMessages(prev => prev.map(msg => 
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      ))
      
      clientLogger.info('Text generation stopped by user', { chatId });
    }
  }

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

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setInput('')

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'USER',
      createdAt: new Date(),
    }

    // Create initial assistant message (will be updated as content streams)
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      content: '',
      role: 'ASSISTANT',
      createdAt: new Date(),
      isStreaming: true,
    }

    // Immediately add both messages to UI
    setMessages(prev => [...prev, userMessage, assistantMessage])
    clientLogger.debug('User and initial assistant messages added to UI', { 
      chatId,
      metadata: { userMessageId: userMessage.id, assistantMessageId: assistantMessage.id }
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
          model: selectedModel || DEFAULT_MODEL, // Default to configured default model if no model specified
        }),
        signal: abortControllerRef.current?.signal,
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

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response stream available')
      }

      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'content') {
                // Update streaming content
                streamedContent += data.content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: streamedContent }
                    : msg
                ))
              } else if (data.type === 'complete') {
                // Mark as complete and handle title update
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, isStreaming: false }
                    : msg
                ))
                
                clientLogger.messageReceived(streamedContent.length, { chatId });
                
                // Update title if this was the first message
                if (data.newTitle && onTitleUpdate) {
                  onTitleUpdate(data.newTitle)
                  clientLogger.info('Chat title updated', { 
                    chatId,
                    metadata: { newTitle: data.newTitle }
                  });
                }
              } else if (data.type === 'error') {
                // Handle streaming error
                if (data.provider) {
                  const aiError = new AIProviderError(
                    data.error,
                    data.provider,
                    data.errorType || 'unknown',
                    500,
                    data.retryAfter
                  )
                  throw aiError
                } else {
                  throw new Error(data.error || 'Streaming error occurred')
                }
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              console.warn('Failed to parse streaming data:', line)
            }
          }
        }
      }
      
    } catch (error) {
      // Don't show error if it was aborted by user
      if (error instanceof Error && error.name === 'AbortError') {
        return // User stopped generation, no need to show error
      }
      
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
      
      // Remove both user and assistant messages on error
      setMessages(prev => prev.filter(msg => 
        msg.id !== userMessage.id && msg.id !== assistantMessage.id
      ))
      clientLogger.debug('Messages removed due to error', { 
        chatId,
        metadata: { userMessageId: userMessage.id, assistantMessageId: assistantMessage.id }
      });
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
      endTiming();
    }
  }

  // Check if AI is currently streaming
  const isStreaming = messages.some(message => message.isStreaming)

  return {
    messages,
    isLoading,
    isStreaming,
    input,
    setInput,
    sendMessage,
    stopGeneration,
    setOnTitleUpdate,
  }
} 