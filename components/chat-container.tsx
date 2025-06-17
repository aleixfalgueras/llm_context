'use client'

import { useChat } from '@/hooks/use-chat'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'

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
  selectedNoteContent?: string | null
  selectedNoteName?: string | null
  onNoteContextSent?: () => void
}

export function ChatContainer({ chatId, initialMessages, userImageUrl, userName, selectedNoteContent, selectedNoteName, onNoteContextSent }: ChatContainerProps) {
  const { messages, isLoading, input, setInput, sendMessage } = useChat(chatId, initialMessages)

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
          selectedNoteContent={selectedNoteContent}
          selectedNoteName={selectedNoteName}
          onNoteContextSent={onNoteContextSent}
        />
      </div>
    </>
  )
} 