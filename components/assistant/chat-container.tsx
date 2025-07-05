'use client'

import { useEffect, memo } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessages } from '@/components/assistant/chat-messages'
import { ChatInput } from '@/components/assistant/chat-input'
import { Message } from '@/types/message-types'

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
}

function ChatContainerComponent({ chatId, initialMessages, userImageUrl, userName, clientData, onTitleUpdate, chatTitle, onDocumentCreated, lastUsedModel }: ChatContainerProps) {
  const { messages, isLoading, isStreaming, sendMessage, stopGeneration, setOnTitleUpdate } = useChat(chatId, initialMessages)
  
  // Set up title update callback
  useEffect(() => {
    if (onTitleUpdate) {
      setOnTitleUpdate(() => onTitleUpdate)
    }
  }, [onTitleUpdate, setOnTitleUpdate])

  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages 
          messages={messages} 
          userImageUrl={userImageUrl}
          userName={userName}
        />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
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
      </div>
    </>
  )
}

export const ChatContainer = memo(ChatContainerComponent) 