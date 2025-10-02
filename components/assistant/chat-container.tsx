'use client'

import {memo, useCallback, useEffect} from 'react'
import {useTranslations} from '@/lib/translations/context'
import {useChat} from '@/hooks/use-chat'
import {ChatMessages} from '@/components/assistant/chat-messages'
import {ChatInput} from '@/components/assistant/chat-input'
import {ErrorBoundary} from '@/components/global/error-boundary'
import {Client, Role} from '@prisma/client'
import {useToast} from '@/hooks/use-toast'
import {exportChat} from '@/app/actions/chat-action'
import {handleClientApiError} from '@/lib/api/api-toast'
import {MessageWithStreaming} from "@/lib/types/message-types";

interface NewChatParams {
  clientId: string | null;
  contextFields: string[];
}

interface ChatContainerProps {
  chatId: string
  initialMessages: MessageWithStreaming[]
  userImageUrl?: string
  userName?: string
  clientData?: Client | null
  onTitleUpdate?: (title: string) => void
  chatTitle?: string
  onDocumentCreated?: (clientId: string, documentId: string) => void
  lastUsedModel?: string
  newChatParams?: NewChatParams
}

function ChatContainerComponent({ chatId, initialMessages, userImageUrl, userName, clientData, onTitleUpdate, chatTitle, onDocumentCreated, lastUsedModel, newChatParams }: ChatContainerProps) {
  const t = useTranslations('assistant')
  const { toast } = useToast()
  const { messages, isLoading, isStreaming, sendMessage, stopGeneration, setOnTitleUpdate } = useChat(chatId, initialMessages, newChatParams)

  // Set up title update callback
  useEffect(() => {
    if (onTitleUpdate) {
      setOnTitleUpdate(() => onTitleUpdate)
    }
  }, [onTitleUpdate, setOnTitleUpdate])

  // Format chat for export
  const formatChatForExport = useCallback((messages: MessageWithStreaming[], title: string, clientData: Client | null | undefined): string => {
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
  }, [t])

  // Handle export chat
  const handleExportChat = useCallback(async () => {
    if (!messages.length || !chatTitle) {
      toast({
        title: t('chat.exportNotAvailable'),
        description: t('exportNotAvailableDescription'),
        variant: 'destructive',
      })
      return
    }

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
    }
  }, [messages, chatTitle, clientData, formatChatForExport, onDocumentCreated, toast, t])

  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error(t('errors.chatContainerError'), error, errorInfo)
      }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <ChatMessages
            messages={messages}
            userImageUrl={userImageUrl}
            userName={userName}
            chatTitle={chatTitle}
            clientData={clientData}
            onDocumentCreated={onDocumentCreated}
            onExportChat={handleExportChat}
          />
        </ErrorBoundary>
      </div>

      {/* Input Area */}
      <div className="p-4">
        <ErrorBoundary>
          <ChatInput 
            chatId={chatId}
            sendMessage={sendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            stopGeneration={stopGeneration}
            clientData={clientData}
            messages={messages}
            chatTitle={chatTitle}
            onDocumentCreated={onDocumentCreated}
            lastUsedModel={lastUsedModel}
          />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}

export const ChatContainer = memo(ChatContainerComponent) 