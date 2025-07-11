'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { clientLogger, withClientTiming } from '@/lib/client-logger'
import { useToast } from '@/hooks/use-toast'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai/errors'
import { DEFAULT_MODEL } from '@/lib/ai/models-config'
import { Message } from '@/types/message-types'

// Helper function to check if messages are likely duplicates
function areMessagesSimilar(msg1: Message, msg2: Message): boolean {
  return (
    msg1.content === msg2.content &&
    msg1.role === msg2.role &&
    Math.abs(new Date(msg1.createdAt).getTime() - new Date(msg2.createdAt).getTime()) < 30000 // Within 30 seconds
  )
}

// Helper function to merge messages avoiding duplicates
function mergeMessages(serverMessages: Message[], currentMessages: Message[]): Message[] {
  const mergedMessages = [...serverMessages]
  
  // Add optimistic messages that don't have server equivalents
  for (const currentMsg of currentMessages) {
    // Check if this is an optimistic message (has temporary ID format)
    const isOptimistic = currentMsg.id.startsWith('temp-user-') || 
                        currentMsg.id.startsWith('temp-assistant-')
    
    if (isOptimistic) {
      // Check if there's already a server message with similar content and timestamp
      const hasServerEquivalent = serverMessages.some(serverMsg => 
        areMessagesSimilar(serverMsg, currentMsg)
      )
      
      // If no server equivalent found, keep the optimistic message
      if (!hasServerEquivalent) {
        mergedMessages.push(currentMsg)
      }
    }
  }
  
  // Sort by creation time to maintain order
  mergedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  
  return mergedMessages
}

export function useChat(chatId: string, initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [onTitleUpdate, setOnTitleUpdate] = useState<((title: string) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Update messages when initialMessages changes (for server-side updates)
  // Use merge strategy to avoid overwriting optimistic updates
  useEffect(() => {
    setMessages(currentMessages => {
      // If no current messages, just use initial messages
      if (currentMessages.length === 0) {
        return initialMessages
      }
      
      // Use helper function to merge messages
      return mergeMessages(initialMessages, currentMessages)
    })
    
    clientLogger.info('Chat messages updated with merge strategy', { 
      chatId,
      metadata: { 
        initialMessageCount: initialMessages.length,
        currentMessageCount: messages.length 
      }
    });
  }, [initialMessages, chatId])

  useEffect(() => {
    clientLogger.componentMount('useChat', { chatId });
    return () => {
      clientLogger.componentUnmount('useChat', { chatId });
    };
  }, [chatId])

  const stopGeneration = useCallback(() => {
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
  }, [chatId])

  const sendMessage = useCallback(async (content: string, selectedModel?: string) => {
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

    // Create user message with more unique temporary ID
    const userMessage: Message = {
      id: `temp-user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      content,
      role: 'USER',
      createdAt: new Date(),
    }

    // Create initial assistant message (will be updated as content streams)
    const assistantMessage: Message = {
      id: `temp-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
  }, [chatId, isLoading, onTitleUpdate, toast])

  // Check if AI is currently streaming
  const isStreaming = useMemo(() => messages.some(message => message.isStreaming), [messages])

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopGeneration,
    setOnTitleUpdate,
  }
} 