'use client'

import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  chatId: string
  input: string
  setInput: (value: string) => void
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
}

export function ChatInput({ chatId, input, setInput, sendMessage, isLoading }: ChatInputProps) {

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

  return (
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
  )
} 