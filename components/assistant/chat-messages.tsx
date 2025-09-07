'use client'

import {ScrollArea} from '@/components/ui/scroll-area'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {Loader2, User} from 'lucide-react'
import {memo, useEffect, useRef, useState} from 'react'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {useTranslations} from '@/lib/translations/context'
import {MessageWithStreaming} from "@/lib/types/message-types";
import {Role} from '@prisma/client'
import {parseMessageImages} from "@/lib/utils/chat-utils";
import {ImageViewDialog} from '@/components/ui/image-view-dialog'

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
  const [selectedImage, setSelectedImage] = useState<{url: string, index: number} | null>(null)
  
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
            🤖
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message Content */}
      <div className={`${isUser ? 'max-w-[70%]' : 'flex-1'} space-y-1 ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Metadata */}
        <div className={`flex items-center gap-2 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-medium">
            {isUser ? (userName || t('chat.you')) : `${t('chat.aiAssistant')}`}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isUser ? new Date(message.createdAt).toLocaleDateString() : (message.model ? ` ${message.model} ` : '')}
          </span>
          {message.isStreaming && (
            <span className="text-xs text-blue-500 dark:text-blue-400">
              {t('typing')}
            </span>
          )}
        </div>

        {/* Message Content - Bubble only for user messages */}
        <div className={isUser ? 'border rounded-lg p-3' : 'pr-5'}>
          {isUser ? (
            <p className="whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <>
              {message.content && <MarkdownRenderer content={message.content} />}
              
              {/* Render images if present */}
              {(() => {
                const parsedImages = parseMessageImages(message.images)
                if (!parsedImages || parsedImages.length === 0) return null
                
                return (
                  <div className="mt-4 space-y-4">
                    {parsedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.image_url.url}
                          alt={`Generated image ${index + 1}`}
                          className="w-full max-w-2xl rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]"
                          style={{ height: 'auto' }}
                          onClick={() => setSelectedImage({ url: image.image_url.url, index: index + 1 })}
                        />
                      </div>
                    ))}
                  </div>
                )
              })()}
              
              {message.isStreaming && (message.content || message.images) && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Image View Dialog */}
      {selectedImage && (
        <ImageViewDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageAlt={`Generated image`}
          imageIndex={selectedImage.index}
        />
      )}
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