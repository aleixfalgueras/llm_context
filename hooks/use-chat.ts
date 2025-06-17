'use client'

import { useState, useEffect } from 'react'

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

  // Update messages when initialMessages changes (for server-side updates)
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ content }],
          chatId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        role: 'ASSISTANT',
        createdAt: new Date(),
      }

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage])
      
      // Update title if this was the first message
      if (data.newTitle && onTitleUpdate) {
        onTitleUpdate(data.newTitle)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
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