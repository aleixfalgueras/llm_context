'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
}

interface ChatMessagesProps {
  messages: Message[]
  userImageUrl?: string
  userName?: string
}

export function ChatMessages({ messages, userImageUrl, userName }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    })
  }

  useEffect(() => {
    if (isInitialLoad.current) {
      // Instant scroll on initial load
      scrollToBottom(false)
      isInitialLoad.current = false
    } else {
      // Smooth scroll for new messages
      scrollToBottom(true)
    }
  }, [messages])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <div className="w-12 h-12 mx-auto mb-4 opacity-50 flex items-center justify-center text-4xl">
              🤖
            </div>
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm">Send a message to begin chatting with HealthCoach AI.</p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                {message.role === 'USER' ? (
                  <>
                    {userImageUrl && <AvatarImage src={userImageUrl} alt={userName || 'User'} />}
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    🤖
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {message.role === 'USER' ? (userName || 'You') : 'HealthCoach AI'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
} 