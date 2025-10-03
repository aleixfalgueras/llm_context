'use client'

import {HelpCircle, Send, Square} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {PromptSelector} from '@/components/prompts/prompt-selector'
import {ModelSelector} from '@/components/ui/model-selector'
import {UsageIndicator} from '@/components/subscription/usage-indicator'
import {Checkbox} from '@/components/ui/checkbox'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {Prompt} from '@prisma/client'
import {MessageWithStreaming} from '@/lib/types/message-types'
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {clientLogger} from '@/lib/client-logger'
import {DEFAULT_MODEL} from '@/lib/models-config'
import {useSubscription} from "@/hooks/subscription/use-subscription";
import {replaceClientContextVariables} from "@/services/client/client-context-service";
import {useTranslations} from '@/lib/translations/context'
import {getTierFromPlan} from "@/lib/utils/model-utils";

// Separate component for just the textarea input to isolate re-renders
interface TextareaInputProps {
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  isStreaming: boolean
  placeholder?: string
  inputRef: React.RefObject<HTMLTextAreaElement>
  autoResize: () => void
}

const TextareaInput = memo(({ onChange, onSubmit, isLoading, isStreaming, placeholder, inputRef, autoResize }: TextareaInputProps) => {

  // Handle input change with auto-resize
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    autoResize()
  }, [onChange, autoResize])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isStreaming) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit, isLoading, isStreaming])

  return (
    <Textarea
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="flex-1 min-h-[60px] resize-none"
      style={{ height: '60px' }}
      ref={inputRef}
    />
  )
})

interface ChatInputProps {
  chatId: string
  sendMessage: (content: string, selectedModel?: string, webSearch?: boolean, isRegeneration?: boolean) => Promise<void>
  isLoading: boolean
  isStreaming: boolean
  stopGeneration: () => void
  clientData?: any // Optional client context for prompt variable replacement
  messages?: MessageWithStreaming[] // Messages for export functionality
  chatTitle?: string // Chat title for export
  onDocumentCreated?: (clientId: string, documentId: string) => void // Callback for when chat is exported
  lastUsedModel?: string // Last model used in this chat
}

function ChatInputComponent({ chatId, sendMessage, isLoading, isStreaming, stopGeneration, clientData, messages = [], chatTitle, onDocumentCreated, lastUsedModel }: ChatInputProps) {
  const t = useTranslations('assistant')
  const subscription = useSubscription()
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
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  // Handle input change with logging - use ref to avoid re-renders
  const handleInputChange = useCallback((value: string) => {
    clientLogger.messageInput(value.length, { 
      chatId,
      component: 'ChatInput'
    });
  }, [chatId])

  const handleSubmit = useCallback(() => {
    const currentInput = inputRef.current?.value || ''
    if (currentInput.trim() && !isLoading && !isStreaming) {
      clientLogger.userInteraction('Submit message', {
        chatId,
        component: 'ChatInput',
        metadata: { messageLength: currentInput.trim().length, model: selectedModel, webSearch: webSearchEnabled }
      });
      sendMessage(currentInput, selectedModel, webSearchEnabled)
      if (inputRef.current) {
        inputRef.current.value = ''
        inputRef.current.style.height = '60px'
      }
    } else {
      clientLogger.warn('Submit attempted with invalid conditions', {
        chatId,
        component: 'ChatInput',
        metadata: { hasInput: !!currentInput.trim(), isLoading, isStreaming }
      });
    }
  }, [isLoading, isStreaming, chatId, selectedModel, webSearchEnabled, sendMessage])

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

  // Component lifecycle logging
  useEffect(() => {
    clientLogger.componentMount('ChatInput', { chatId });
    return () => {
      clientLogger.componentUnmount('ChatInput', { chatId });
    };
  }, [chatId]);

  const handleStop = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    clientLogger.userInteraction('Stop generation', { 
      chatId,
      component: 'ChatInput'
    });
    stopGeneration()
  }, [chatId, stopGeneration])

  return (
    <div className="space-y-2">
      {/* Prompt Selector, Model Selector, Usage Indicator */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <PromptSelector onPromptSelect={handlePromptSelect} />
          <ModelSelector
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
            userTier={getTierFromPlan(subscription.plan)}
          />
          <div className="flex items-center gap-1">
            <Checkbox
              checked={webSearchEnabled}
              onChange={(e) => setWebSearchEnabled(e.target.checked)}
              label={t('webSearch')}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t('webSearchTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <UsageIndicator />
      </div>
      
      {/* Chat Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <TextareaInput
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isStreaming={isStreaming}
          placeholder={t('inputPlaceholder')}
          inputRef={inputRef}
          autoResize={autoResize}
        />
        {isStreaming ? (
          <Button 
            type="button"
            onClick={handleStop}
            size="icon"
            variant="secondary"
            className="h-[60px] w-[60px]"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            type="submit" 
            size="icon" 
            className="h-[60px] w-[60px]"
            disabled={isLoading || isStreaming}
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