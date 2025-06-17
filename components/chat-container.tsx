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
}

export function ChatContainer({ chatId, initialMessages }: ChatContainerProps) {
  const { messages, isLoading, input, setInput, sendMessage } = useChat(chatId, initialMessages)

  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages messages={messages} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput 
          chatId={chatId}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </>
  )
} 