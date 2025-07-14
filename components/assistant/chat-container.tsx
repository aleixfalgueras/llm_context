'use client'

import {memo, useEffect} from 'react'
import {useChat} from '@/hooks/use-chat'
import {ChatMessages} from '@/components/assistant/chat-messages'
import {ChatInput} from '@/components/assistant/chat-input'
import {ErrorBoundary} from '@/components/global/error-boundary'
import {Message} from '@/types/message-types'

interface NewChatParams {
  clientId: string;
  contextFields: string[];
}

interface ChatContainerProps {
  chatId: string
  initialMessages: Message[]
  userImageUrl?: string
  userName?: string
  clientData?: any
  onTitleUpdate?: (title: string) => void
  chatTitle?: string
  onDocumentCreated?: (clientId: string, documentId: string) => void
  lastUsedModel?: string
  newChatParams?: NewChatParams
}

function ChatContainerComponent({ chatId, initialMessages, userImageUrl, userName, clientData, onTitleUpdate, chatTitle, onDocumentCreated, lastUsedModel, newChatParams }: ChatContainerProps) {
  const { messages, isLoading, isStreaming, sendMessage, stopGeneration, setOnTitleUpdate } = useChat(chatId, initialMessages, newChatParams)
  
  // Set up title update callback
  useEffect(() => {
    if (onTitleUpdate) {
      setOnTitleUpdate(() => onTitleUpdate)
    }
  }, [onTitleUpdate, setOnTitleUpdate])

  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Chat container error:', error, errorInfo)
        // Could add error reporting here
      }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <ChatMessages 
            messages={messages} 
            userImageUrl={userImageUrl}
            userName={userName}
          />
        </ErrorBoundary>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
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