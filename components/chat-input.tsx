'use client'

import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addUsedNoteToChat } from '@/lib/actions'

interface ChatInputProps {
  chatId: string
  input: string
  setInput: (value: string) => void
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  selectedNoteContent?: string | null
  selectedNoteName?: string | null
  onNoteContextSent?: () => void
}

export function ChatInput({ chatId, input, setInput, sendMessage, isLoading, selectedNoteContent, selectedNoteName, onNoteContextSent }: ChatInputProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      let messageContent = input
      const hasNoteContext = selectedNoteContent !== null
      
      // Add note context if a note is selected
      if (selectedNoteContent) {
        messageContent = `Context information:\n\"\"\"${selectedNoteContent}\n\"\"\"\n\n${input}`
        console.log(messageContent)
      }
      
      sendMessage(messageContent).then(async () => {
        // After successfully sending message with context, track the used note
        if (hasNoteContext && selectedNoteName) {
          try {
            await addUsedNoteToChat(chatId, selectedNoteName)
          } catch (error) {
            console.error('Failed to track used note:', error)
          }
        }
        
        // Deselect the note
        if (hasNoteContext && onNoteContextSent) {
          onNoteContextSent()
        }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="space-y-3">
      {selectedNoteContent && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">
            📝 Note context will be included with your message
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            The selected note content will be automatically added as context for the AI
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedNoteContent 
            ? "Ask about your note or type your message..." 
            : "Type your message... (Press Enter to send, Shift+Enter for new line)"
          }
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