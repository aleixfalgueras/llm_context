'use client'

import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PromptSelector } from '@/components/prompt-selector'

interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
}

interface ChatInputProps {
  chatId: string
  input: string
  setInput: (value: string) => void
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  clientData?: any // Optional client context for prompt variable replacement
}

export function ChatInput({ chatId, input, setInput, sendMessage, isLoading, clientData }: ChatInputProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      sendMessage(input)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handlePromptSelect = (prompt: Prompt) => {
    let processedContent = prompt.content

    // Replace variables with client data if available
    if (clientData) {
      processedContent = processedContent
        .replace(/\{client_name\}/g, clientData.name || '[Client Name]')
        .replace(/\{medical_history\}/g, clientData.medicalHistory || '[Medical History]')
        .replace(/\{goals\}/g, clientData.goals || '[Goals]')
        .replace(/\{height\}/g, clientData.height ? `${clientData.height}cm` : '[Height]')
        .replace(/\{weight\}/g, clientData.weight ? `${clientData.weight}kg` : '[Weight]')
        .replace(/\{age\}/g, clientData.dateOfBirth ? 
          `${Math.floor((Date.now() - new Date(clientData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}` : '[Age]')
        .replace(/\{country\}/g, clientData.country || '[Country]')
    }

    // If there's existing input, add the prompt on a new line
    const newInput = input.trim() 
      ? `${input}\n\n${processedContent}`
      : processedContent

    setInput(newInput)
  }

  return (
    <div className="space-y-2">
      {/* Prompt Selector */}
      <div className="flex justify-start">
        <PromptSelector onPromptSelect={handlePromptSelect} />
      </div>
      
      {/* Chat Input Form */}
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        className="flex-1 min-h-[60px] max-h-[120px] resize-none"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        size="icon" 
        className="h-[60px] w-[60px]"
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
    </div>
  )
} 