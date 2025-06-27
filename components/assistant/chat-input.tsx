'use client'

import { Send, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PromptSelector } from '@/components/prompts/prompt-selector'
import { ModelSelector } from '@/components/ui/model-selector'
import { replaceClientVariables } from '@/lib/variable-replacement'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect, useRef } from 'react'
import { clientLogger, withClientTiming } from '@/lib/client-logger'
import { AVAILABLE_MODELS, getDefaultModelForNewChats, saveDefaultModelForNewChats } from '@/lib/models-config'

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
  sendMessage: (content: string, selectedModel?: string) => Promise<void>
  isLoading: boolean
  clientData?: any // Optional client context for prompt variable replacement
  messages?: Message[] // Messages for export functionality
  chatTitle?: string // Chat title for export
  onDocumentCreated?: (clientId: string, documentId: string) => void // Callback for when chat is exported
  lastUsedModel?: string // Last model used in this chat
}

export function ChatInput({ chatId, input, setInput, sendMessage, isLoading, clientData, messages = [], chatTitle, onDocumentCreated, lastUsedModel }: ChatInputProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedModel, setSelectedModel] = useState(() => {
    // If this is an existing chat with a lastUsedModel, use that
    if (lastUsedModel) {
      return lastUsedModel
    }
    
    // For new chats, read localStorage directly (client-side only)
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('chat-default-model')
      if (savedModel) {
        // Validate the saved model exists in available models
        const isValidModel = ['gpt-4o', 'gpt-4o-mini', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'].includes(savedModel)
        if (isValidModel) {
          return savedModel
        }
      }
    }
    
    // Default fallback
    return 'gpt-4o-mini'
  })
  
  const { toast } = useToast()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea function
  const autoResize = () => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.style.height = 'auto'
      const newHeight = Math.min(textArea.scrollHeight, 200)
      textArea.style.height = `${newHeight}px`
      
      // Enable scroll if content exceeds max height
      if (textArea.scrollHeight > 200) {
        textArea.style.overflowY = 'auto'
      } else {
        textArea.style.overflowY = 'hidden'
      }
    }
  }

  // Handle input change with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    autoResize()
    clientLogger.messageInput(e.target.value.length, { 
      chatId,
      component: 'ChatInput'
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      clientLogger.userInteraction('Submit message', { 
        chatId,
        component: 'ChatInput',
        metadata: { messageLength: input.trim().length, model: selectedModel }
      });
      sendMessage(input, selectedModel)
    } else {
      clientLogger.warn('Submit attempted with invalid conditions', { 
        chatId,
        component: 'ChatInput',
        metadata: { hasInput: !!input.trim(), isLoading }
      });
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handlePromptSelect = (prompt: Prompt) => {
    clientLogger.promptSelected(prompt.name, { 
      chatId,
      component: 'ChatInput',
      metadata: { promptId: prompt.id, category: prompt.category }
    });

    // Replace variables with client data if available using shared utility
    const processedContent = clientData 
      ? replaceClientVariables(prompt.content, clientData)
      : prompt.content

    // If there's existing input, add the prompt on a new line
    const newInput = input.trim() 
      ? `${input}\n\n${processedContent}`
      : processedContent

    setInput(newInput)
    clientLogger.debug('Prompt content added to input', { 
      chatId,
      component: 'ChatInput',
      metadata: { finalLength: newInput.length, hasVariables: !!clientData }
    });
  }

  const handleExportChat = async () => {
    if (!clientData?.id || !messages.length || !chatTitle) {
      clientLogger.warn('Export attempted with missing requirements', { 
        chatId,
        component: 'ChatInput',
        metadata: { 
          hasClientId: !!clientData?.id, 
          hasMessages: !!messages.length, 
          hasChatTitle: !!chatTitle 
        }
      });
      
      toast({
        title: 'Export Not Available',
        description: 'Cannot export chat without client association and messages.',
        variant: 'destructive',
      })
      return
    }

    clientLogger.exportInitiated('chat', { 
      chatId,
      clientId: clientData.id,
      component: 'ChatInput',
      metadata: { messageCount: messages.length, chatTitle }
    });

    setIsExporting(true)
    try {
      // Format messages for export
      const chatContent = await withClientTiming(
        'Format chat for export',
        () => formatChatForExport(messages, chatTitle, clientData),
        { chatId, clientId: clientData.id }
      );
      
      clientLogger.apiCall('POST', '/api/ai-services/save-chat-export', { 
        chatId,
        clientId: clientData.id
      });
      
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

      clientLogger.apiResponse('POST', '/api/ai-services/save-chat-export', response.status, { 
        chatId,
        clientId: clientData.id
      });

      if (!response.ok) {
        // Handle different error status codes
        const errorText = await response.text()
        
        if (response.status === 403) {
          // Usage limit exceeded
          throw new Error(errorText || 'Document creation limit exceeded')
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }

      const data = await response.json()

      clientLogger.exportCompleted('chat', { 
        chatId,
        clientId: clientData.id,
        metadata: { documentId: data.documentId }
      });

      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Chat Exported 📄',
          description: (
            <div>
              <p>Chat "{chatTitle}" has been saved as a document.</p>
              <button 
                onClick={() => onDocumentCreated(clientData.id, data.documentId)}
                className="text-blue-600 hover:text-blue-800 underline font-medium mt-1 block"
              >
                📄 View Document
              </button>
            </div>
          ),
          duration: 10000,
        })
      } else {
        toast({
          title: 'Chat Exported 📄',
          description: `Chat "${chatTitle}" has been saved as a document. You can find it in the client's documents.`,
          duration: 8000,
        })
      }

    } catch (error) {
      clientLogger.error('Error exporting chat', error as Error, { 
        chatId,
        clientId: clientData?.id
      });
      
      // Check if it's a usage limit error
      const errorMessage = error instanceof Error ? error.message : 'Failed to export chat. Please try again.'
      const isLimitError = errorMessage.includes('limit')
      
      toast({
        title: isLimitError ? 'Document Limit Reached' : 'Export Failed',
        description: errorMessage,
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

  // Component lifecycle logging
  useEffect(() => {
    clientLogger.componentMount('ChatInput', { chatId });
    return () => {
      clientLogger.componentUnmount('ChatInput', { chatId });
    };
  }, [chatId]);

  // Update selected model when switching between chats
  useEffect(() => {
    // If switching to an existing chat with a specific model, use that
    if (lastUsedModel) {
      setSelectedModel(lastUsedModel)
      return
    }
    
    // For new chats, check localStorage
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('chat-default-model')
      if (savedModel) {
        const isValidModel = ['gpt-4o', 'gpt-4o-mini', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'].includes(savedModel)
        if (isValidModel) {
          setSelectedModel(savedModel)
          return
        }
      }
    }
    
    // Fallback to default
    setSelectedModel('gpt-4o-mini')
    
    clientLogger.debug('Model selection updated', { 
      chatId,
      component: 'ChatInput',
      metadata: { model: selectedModel, source: lastUsedModel ? 'chat-specific' : 'localStorage' }
    });
  }, [lastUsedModel, chatId])

  // Auto-resize when input changes
  useEffect(() => {
    if (input.trim()) {
      autoResize()
    } else {
      // Reset to initial height when input is cleared
      const textArea = textAreaRef.current
      if (textArea) {
        textArea.style.height = '60px'
        textArea.style.overflowY = 'hidden'
      }
    }
  }, [input])

  // Handle model selection - save to localStorage for future new chats
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    
    // Save to localStorage directly for future new chats
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-default-model', modelId)
    }
    
    clientLogger.debug('Model saved as default for new chats', { 
      chatId,
      component: 'ChatInput',
      metadata: { model: modelId }
    });
  }

  return (
    <div className="space-y-2">
      {/* Prompt Selector, Model Selector, and Export Button */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
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
        <ModelSelector 
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </div>
      
      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          className="flex-1 min-h-[60px] resize-none"
          style={{ height: '60px' }}
          disabled={isLoading}
          ref={textAreaRef}
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