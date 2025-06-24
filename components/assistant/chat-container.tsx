'use client'

import { useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessages } from '@/components/assistant/chat-messages'
import { ChatInput } from '@/components/assistant/chat-input'

interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
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
}

export function ChatContainer({ chatId, initialMessages, userImageUrl, userName, clientData, onTitleUpdate, chatTitle, onDocumentCreated, lastUsedModel }: ChatContainerProps) {
  const { messages, isLoading, input, setInput, sendMessage, setOnTitleUpdate } = useChat(chatId, initialMessages)
  
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
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
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