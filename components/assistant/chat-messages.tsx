'use client'

import {ScrollArea} from '@/components/ui/scroll-area'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Loader2, User} from 'lucide-react'
import {memo, useEffect, useRef} from 'react'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {useTranslations} from '@/lib/translations/context'
import {MessageWithStreaming} from "@/lib/types/message-types";
import {Role} from '@prisma/client'

interface ChatMessagesProps {
  messages: MessageWithStreaming[]
  userImageUrl?: string
  userName?: string
}

interface MessageBubbleProps {
  message: MessageWithStreaming
  userImageUrl?: string
  userName?: string
}

const MessageBubble = memo(({ message, userImageUrl, userName }: MessageBubbleProps) => {
  const t = useTranslations('assistant')
  const isUser = message.role === Role.USER
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      <Avatar className={`w-8 h-8 ${isUser ? 'order-2' : 'order-1'}`}>
        {isUser ? (
          <>
            {userImageUrl && <AvatarImage src={userImageUrl} alt={userName || t('user')} />}
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            {message.isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : '🤖'}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className={`max-w-[70%] space-y-1 ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Metadata */}
        <div className={`flex items-center gap-2 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-medium">
            {isUser ? (userName || t('chat.you')) : t('chat.aiAssistant')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
          {message.isStreaming && (
            <span className="text-xs text-blue-500 dark:text-blue-400">
              {t('typing')}
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div className={`border rounded-lg p-3`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <>
              <MarkdownRenderer content={message.content} />
              {message.isStreaming && message.content && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'

function ChatMessagesComponent({ messages, userImageUrl, userName }: ChatMessagesProps) {
  const t = useTranslations('assistant')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-lg">{t('startConversation')}</p>
            <p className="text-sm">{t('startConversationSubtext')}</p>
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            userImageUrl={userImageUrl}
            userName={userName}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

export const ChatMessages = memo(ChatMessagesComponent)