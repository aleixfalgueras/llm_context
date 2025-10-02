'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {clientLogger, withClientTiming} from '@/lib/client-logger'
import {DEFAULT_MODEL} from '@/lib/models-config'
import {handleClientApiError} from '@/lib/api/api-toast'
import {MessageWithStreaming} from "@/lib/types/message-types"

// Helper function to check if messages are likely duplicates
function areMessagesSimilar(msg1: MessageWithStreaming, msg2: MessageWithStreaming): boolean {
  return (
    msg1.content === msg2.content &&
    msg1.role === msg2.role &&
    Math.abs(new Date(msg1.createdAt).getTime() - new Date(msg2.createdAt).getTime()) < 30000 // Within 30 seconds
  )
}

// Helper function to merge messages avoiding duplicates
function mergeMessages(serverMessages: MessageWithStreaming[], currentMessages: MessageWithStreaming[]): MessageWithStreaming[] {
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

interface NewChatParams {
  clientId: string | null;
  contextFields: string[];
}

export function useChat(chatId: string, initialMessages: MessageWithStreaming[] = [], newChatParams?: NewChatParams) {
  const [messages, setMessages] = useState<MessageWithStreaming[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [onTitleUpdate, setOnTitleUpdate] = useState<((title: string) => void) | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const sendMessage = useCallback(async (content: string, selectedModel?: string, webSearch?: boolean) => {
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
    const userMessage: MessageWithStreaming = {
      id: `temp-user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      content,
      role: 'USER',
      model: null,
      cost_usd: 0,
      generation_id: null,
      images: null,
      isPartialMessage: false,
      chatId,
      createdAt: new Date(),
    }

    // Create initial assistant message (will be updated as content streams)
    const assistantMessage: MessageWithStreaming = {
      id: `temp-assistant-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      content: '',
      role: 'ASSISTANT',
      model: null,
      cost_usd: 0,
      generation_id: null,
      images: null,
      isPartialMessage: false,
      chatId,
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
            chatId: chatId || undefined, // Send undefined for new chats
            model: selectedModel || DEFAULT_MODEL, // Default to configured default model if no model specified
            webSearch: webSearch || false,
            // Include new chat parameters if this is a new chat
            ...(newChatParams && {
              clientId: newChatParams.clientId,
              contextFields: newChatParams.contextFields
            })
          }),
          signal: abortControllerRef.current?.signal,
        }),
        { chatId }
      );

      clientLogger.apiResponse('POST', '/api/chat', response.status, { chatId });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))
        
        // Mark streaming as complete for the assistant message
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, isStreaming: false }
            : msg
        ))

        handleClientApiError(errorData.error || 'An error occurred during streaming', 'Streaming Error')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      let streamedContent = ''
      let streamedImages: any[] = []
      let buffer = '' // Buffer to accumulate incomplete messages

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Process complete SSE messages (ending with double newline)
        const messages = buffer.split('\n\n')

        // Keep the last part (potentially incomplete message) in the buffer
        buffer = messages.pop() || ''

        for (const message of messages) {
          // Skip empty messages
          if (!message.trim()) continue

          // Extract data lines from the message
          const lines = message.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.slice(6)

                // Skip [DONE] messages
                if (dataStr === '[DONE]') continue

                const data = JSON.parse(dataStr)

                if (data.type === 'content') {
                  // Update streaming content
                  streamedContent += data.content
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: streamedContent }
                      : msg
                  ))
                } else if (data.type === 'images') {
                  // Handle streaming images
                  if (data.images && Array.isArray(data.images)) {
                    streamedImages.push(...data.images)
                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? { ...msg, images: [...streamedImages] }
                        : msg
                    ))
                    clientLogger.info('Images received in stream', {
                      chatId,
                      metadata: { imageCount: data.images.length }
                    });
                  }
                } else if (data.type === 'complete') {
                  // Mark as complete and handle title update
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, isStreaming: false }
                      : msg
                  ))

                  clientLogger.messageReceived(streamedContent.length, { chatId });

                  // Handle new chat creation - redirect to the new chat URL
                  if (data.chatId && data.chatId !== chatId) {
                    clientLogger.info('New chat created, redirecting', {
                      chatId: data.chatId,
                      metadata: {
                        originalChatId: chatId,
                        newChatId: data.chatId
                      }
                    });
                    // Use window.location to redirect to the new chat
                    window.location.href = `/assistant/chat/${data.chatId}`;
                    return;
                  }

                  // Update title if this was the first message
                  if (data.newTitle && onTitleUpdate) {
                    onTitleUpdate(data.newTitle)
                    clientLogger.info('Chat title updated', {
                      chatId,
                      metadata: { newTitle: data.newTitle }
                    });
                  }
                } else if (data.type === 'error') {
                  // Handle streaming error - stop streaming and show error
                  clientLogger.error(`Streaming error received: ${data.error}`);
                  
                  // Mark streaming as complete with error (keep existing content)
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, isStreaming: false }
                      : msg
                  ))
                  
                  // Show the error to the user
                  handleClientApiError(data.error || 'An error occurred during streaming', 'Streaming Error')
                  
                  // Clean up and stop processing
                  setIsLoading(false)
                  abortControllerRef.current = null
                  
                  return // Exit the streaming loop
                }
              } catch (parseError) {
                // Log parsing errors with more detail
                clientLogger.warn('Failed to parse SSE data', {
                  chatId,
                  metadata: {
                    error: parseError instanceof Error ? parseError.message : 'Unknown error',
                    dataPreview: line.slice(6, 100) + '...'
                  }
                })
              }
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

      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      handleClientApiError(errorMessage, 'Failed to send message')

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
  }, [chatId, isLoading, onTitleUpdate])

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