'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { clientLogger } from '@/lib/client-logger'

export function useChatInput(chatId: string) {
  const [input, setInput] = useState('')
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea function
  const autoResize = useCallback(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.style.height = 'auto'
      const newHeight = Math.min(textArea.scrollHeight, 200)
      textArea.style.height = `${newHeight}px`
      
      if (textArea.scrollHeight > 200) {
        textArea.style.overflowY = 'auto'
      } else {
        textArea.style.overflowY = 'hidden'
      }
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    autoResize()
    clientLogger.messageInput(e.target.value.length, { 
      chatId,
      component: 'useChatInput'
    });
  }, [autoResize, chatId])

  const clearInput = useCallback(() => {
    setInput('')
  }, [])

  const addToInput = useCallback((content: string) => {
    setInput(prev => {
      const newInput = prev.trim() 
        ? `${prev}\n\n${content}`
        : content
      return newInput
    })
  }, [])

  // Auto-resize when input changes
  useEffect(() => {
    if (input.trim()) {
      autoResize()
    } else {
      const textArea = textAreaRef.current
      if (textArea) {
        textArea.style.height = '60px'
        textArea.style.overflowY = 'hidden'
      }
    }
  }, [input, autoResize])

  return {
    input,
    setInput,
    handleInputChange,
    clearInput,
    addToInput,
    textAreaRef,
    autoResize
  }
}