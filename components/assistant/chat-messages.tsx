'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MarkdownRenderer } from '@/components/global/markdown-renderer'
import { Message } from '@/types/message-types'

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
            <p className="text-sm">Send a message to begin chatting with your AI assistant.</p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'USER' ? 'flex-row-reverse' : ''}`}>
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
                    {message.isStreaming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '🤖'
                    )}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className={`space-y-1 max-w-[70%] ${message.role === 'USER' ? 'ml-auto' : ''}`}>
                <div className={`flex items-center gap-2 ${message.role === 'USER' ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-sm">
                    {message.role === 'USER' ? (userName || 'You') : 'AI Assistant'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                  {message.isStreaming && (
                    <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span>
                      Typing...
                    </span>
                  )}
                </div>
                {message.role === 'ASSISTANT' ? (
                  <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <MarkdownRenderer content={message.content} />
                    {message.isStreaming && message.content && (
                      <div className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                    )}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message.content}</p>
                  </div>
                )}
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