'use client'

import {Download, Send, Square} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {PromptSelector} from '@/components/prompts/prompt-selector'
import {ModelSelector} from '@/components/ui/model-selector'
import {useToast} from '@/hooks/use-toast'
import {Message, Prompt, Role} from '@prisma/client'
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {clientLogger} from '@/lib/client-logger'
import {DEFAULT_MODEL, getTierFromPlan} from '@/lib/models-config'
import {useSubscription} from "@/hooks/subscription/use-subscription";
import {handleClientApiError} from '@/lib/api/api-toast'
import {replaceClientContextVariables} from "@/services/client/client-context-service";
import {exportChat} from '@/app/actions/chat-action'
import {useTranslations} from '@/lib/translations/context'

// Separate component for just the textarea input to isolate re-renders
interface TextareaInputProps {
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  placeholder?: string
  inputRef: React.RefObject<HTMLTextAreaElement>
  autoResize: () => void
}

const TextareaInput = memo(({ onChange, onSubmit, isLoading, placeholder, inputRef, autoResize }: TextareaInputProps) => {

  // Handle input change with auto-resize
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    autoResize()
  }, [onChange, autoResize])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit])

  return (
    <Textarea
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="flex-1 min-h-[60px] resize-none"
      style={{ height: '60px' }}
      disabled={isLoading}
      ref={inputRef}
    />
  )
})

interface ChatInputProps {
  chatId: string
  sendMessage: (content: string, selectedModel?: string) => Promise<void>
  isLoading: boolean
  isStreaming: boolean
  stopGeneration: () => void
  clientData?: any // Optional client context for prompt variable replacement
  messages?: Message[] // Messages for export functionality
  chatTitle?: string // Chat title for export
  onDocumentCreated?: (clientId: string, documentId: string) => void // Callback for when chat is exported
  lastUsedModel?: string // Last model used in this chat
}

function ChatInputComponent({ chatId, sendMessage, isLoading, isStreaming, stopGeneration, clientData, messages = [], chatTitle, onDocumentCreated, lastUsedModel }: ChatInputProps) {
  const t = useTranslations('assistant')
  const subscription = useSubscription()
  const [isExporting, setIsExporting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea function
  const autoResize = useCallback(() => {
    const textArea = inputRef.current
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
  }, [inputRef])
  const [selectedModel, setSelectedModel] = useState(() => {
    // For new chats (no messages), use DEFAULT_MODEL
    // For existing chats with messages, use lastUsedModel or fallback to DEFAULT_MODEL
    if (messages.length === 0) {
      return DEFAULT_MODEL
    }
    return lastUsedModel || DEFAULT_MODEL
  })
  
  const { toast } = useToast()

  // Handle input change with logging - use ref to avoid re-renders
  const handleInputChange = useCallback((value: string) => {
    clientLogger.messageInput(value.length, { 
      chatId,
      component: 'ChatInput'
    });
  }, [chatId])

  const handleSubmit = useCallback(() => {
    const currentInput = inputRef.current?.value || ''
    if (currentInput.trim() && !isLoading) {
      clientLogger.userInteraction('Submit message', { 
        chatId,
        component: 'ChatInput',
        metadata: { messageLength: currentInput.trim().length, model: selectedModel }
      });
      sendMessage(currentInput, selectedModel)
      if (inputRef.current) {
        inputRef.current.value = ''
        inputRef.current.style.height = '60px'
      }
    } else {
      clientLogger.warn('Submit attempted with invalid conditions', { 
        chatId,
        component: 'ChatInput',
        metadata: { hasInput: !!currentInput.trim(), isLoading }
      });
    }
  }, [isLoading, chatId, selectedModel, sendMessage])

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit()
  }, [handleSubmit])

  const handlePromptSelect = useCallback((prompt: Prompt) => {
    clientLogger.promptSelected(prompt.name, { 
      chatId,
      component: 'ChatInput',
      metadata: { promptId: prompt.id, category: prompt.category }
    });

    // Replace variables with client data if available using shared utility
    const processedContent = clientData 
      ? replaceClientContextVariables(prompt.content, clientData)
      : prompt.content

    // If there's existing input, add the prompt on a new line
    const currentInput = inputRef.current?.value || ''
    const newInput = currentInput.trim() 
      ? `${currentInput}\n\n${processedContent}`
      : processedContent

    if (inputRef.current) {
      inputRef.current.value = newInput
      // Trigger auto-resize after setting prompt content
      autoResize()
    }
    clientLogger.debug('Prompt content added to input', { 
      chatId,
      component: 'ChatInput',
      metadata: { finalLength: newInput.length, hasVariables: !!clientData }
    });
  }, [chatId, clientData, autoResize])

  const handleExportChat = async () => {
    if (!messages.length || !chatTitle) {
      toast({
        title: t('chat.exportNotAvailable'),
        description: t('exportNotAvailableDescription'),
        variant: 'destructive',
      })
      return
    }

    setIsExporting(true)
    try {
      const chatContent = formatChatForExport(messages, chatTitle, clientData)
      
      const result = await exportChat(clientData?.id || null, chatContent, chatTitle)
      const documentId = result.documentId

      toast({
        title: t('chat.chatExported'),
        description: (
          <div>
            <p>{t('chatExportedDescription', { chatTitle })}</p>
            {onDocumentCreated && documentId && clientData?.id && (
              <button 
                onClick={() => {
                  onDocumentCreated(clientData.id, documentId)
                }}
                className="text-blue-600 hover:text-blue-800 underline font-medium mt-1 block"
              >
                {t('viewDocument')}
              </button>
            )}
          </div>
        ),
        duration: 10000,
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('exportFailed')
      handleClientApiError(errorMessage, t('exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  const formatChatForExport = (messages: Message[], title: string, clientData: any): string => {
    const exportDate = new Date().toLocaleDateString()
    const exportTime = new Date().toLocaleTimeString()
    
    let content = `# ${title}\n\n`
    
    // Add client information if available
    if (clientData) {
      content += `**${t('chat.client')}:** ${clientData.name}\n\n`
      if (clientData.email) content += `**${t('chat.email')}:** ${clientData.email}\n\n`
      if (clientData.country) content += `**${t('chat.country')}:** ${clientData.country}\n\n`
    } else {
      content += `**${t('chat.type')}:** ${t('chat.generalChat')}\n\n`
    }
    
    content += `**${t('chat.exportDate')}:** ${exportDate} ${t('at')} ${exportTime}\n\n`
    content += `---\n\n`
    
    messages.forEach((message) => {
      const timestamp = new Date(message.createdAt).toLocaleString()
      const role = message.role === Role.USER ? t('chat.you') : t('chat.aiAssistant')
      
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

  const handleStop = useCallback(() => {
    clientLogger.userInteraction('Stop generation', { 
      chatId,
      component: 'ChatInput'
    });
    stopGeneration()
  }, [chatId, stopGeneration])

  return (
    <div className="space-y-2">
      {/* Prompt Selector, Model Selector and Export Button */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <PromptSelector onPromptSelect={handlePromptSelect} />
          <ModelSelector 
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            userTier={getTierFromPlan(subscription.plan)}
          />
        </div>
        <div className="flex gap-2">
          {/* Export Chat Button - show if there are messages and client data */}
          {messages.length > 0 && clientData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportChat}
              disabled={isExporting}
              className="justify-between"
            >
              {isExporting ? (
                <LoadingSpinner size="sm" text="" className="mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
{isExporting ? t('chat.exporting') : t('chat.exportChat')}
            </Button>
          )}
        </div>
      </div>
      
      {/* Chat Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <TextareaInput
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder={t('inputPlaceholder')}
          inputRef={inputRef}
          autoResize={autoResize}
        />
        {isStreaming ? (
          <Button 
            type="button"
            onClick={handleStop}
            size="icon" 
            className="h-[60px] w-[60px] bg-red-500 hover:bg-red-600"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            type="submit" 
            size="icon" 
            className="h-[60px] w-[60px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        )}
      </form>
    </div>
  )
}

export const ChatInput = memo(ChatInputComponent) 