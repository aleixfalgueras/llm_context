'use client'

import { Send, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PromptSelector } from '@/components/prompt-selector'
import { replaceClientVariables } from '@/lib/variable-replacement'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
}

interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
}

interface ChatInputProps {
  chatId: string
  input: string
  setInput: (value: string) => void
  sendMessage: (content: string) => Promise<void>
  isLoading: boolean
  clientData?: any // Optional client context for prompt variable replacement
  messages?: Message[] // Messages for export functionality
  chatTitle?: string // Chat title for export
}

export function ChatInput({ chatId, input, setInput, sendMessage, isLoading, clientData, messages = [], chatTitle }: ChatInputProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

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
    // Replace variables with client data if available using shared utility
    const processedContent = clientData 
      ? replaceClientVariables(prompt.content, clientData)
      : prompt.content

    // If there's existing input, add the prompt on a new line
    const newInput = input.trim() 
      ? `${input}\n\n${processedContent}`
      : processedContent

    setInput(newInput)
  }

  const handleExportChat = async () => {
    if (!clientData?.id || !messages.length || !chatTitle) {
      toast({
        title: 'Export Not Available',
        description: 'Cannot export chat without client association and messages.',
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      // Format messages for export
      const chatContent = formatChatForExport(messages, chatTitle, clientData)
      
      const response = await fetch('/api/ai-services/save-chat-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientData.id,
          content: chatContent,
          chatTitle,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      toast({
        title: 'Chat Exported 📄',
        description: `Chat "${chatTitle}" has been saved as a document. You can find it in the client's documents.`,
        duration: 8000,
      })

    } catch (error) {
      console.error('Error exporting chat:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export chat. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const formatChatForExport = (messages: Message[], title: string, clientData: any): string => {
    const exportDate = new Date().toLocaleDateString()
    const exportTime = new Date().toLocaleTimeString()
    
    let content = `# ${title}\n\n`
    content += `**Client:** ${clientData.name}\n`
    if (clientData.email) content += `**Email:** ${clientData.email}\n`
    if (clientData.country) content += `**Country:** ${clientData.country}\n`
    content += `**Export Date:** ${exportDate} at ${exportTime}\n\n`
    content += `---\n\n`
    
    messages.forEach((message) => {
      const timestamp = new Date(message.createdAt).toLocaleString()
      const role = message.role === 'USER' ? 'You' : 'AI Assistant'
      
      content += `## ${role} - ${timestamp}\n\n`
      content += `${message.content}\n\n`
      content += `---\n\n`
    })
    
    return content
  }

  return (
    <div className="space-y-2">
      {/* Prompt Selector and Export Button */}
      <div className="flex justify-start gap-2">
        <PromptSelector onPromptSelect={handlePromptSelect} />
        {/* Export Chat Button - only show if client is associated and has messages */}
        {clientData?.id && messages.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportChat}
            disabled={isExporting}
            className="justify-between"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export Chat'} 📄
          </Button>
        )}
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