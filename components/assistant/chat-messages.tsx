'use client'

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'
import {ArrowDown, Copy, Download, User} from 'lucide-react'
import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {useTranslations} from '@/lib/translations/context'
import {MessageWithStreaming} from "@/lib/types/message-types";
import {Role} from '@prisma/client'
import {parseMessageImages} from "@/lib/utils/chat-utils";
import {ImageViewDialog} from '@/components/ui/image-view-dialog'
import {getModelDisplayName} from '@/lib/utils/model-utils'
import {Button} from '@/components/ui/button'
import {toast} from '@/hooks/use-toast'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'

interface ChatMessagesProps {
  messages: MessageWithStreaming[]
  userImageUrl?: string
  userName?: string
  chatTitle?: string
  clientData?: any
  onDocumentCreated?: (clientId: string, documentId: string) => void
  onExportChat?: () => Promise<void>
}

interface MessageBubbleProps {
  message: MessageWithStreaming
  userImageUrl?: string
  userName?: string
  isLastAssistantMessage?: boolean
  onExportChat?: () => Promise<void>
  isExporting?: boolean
}

const MessageBubble = memo(({ message, userImageUrl, userName, isLastAssistantMessage, onExportChat, isExporting }: MessageBubbleProps) => {
  const t = useTranslations('assistant')
  const isUser = message.role === Role.USER
  const [selectedImage, setSelectedImage] = useState<{url: string, index: number} | null>(null)
  
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: t('copied'),
      description: t('copiedToClipboard'),
    })
  }
  
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
      <div className={`${isUser ? 'max-w-[70%]' : 'min-w-0 flex-1'} space-y-1 ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Metadata */}
        <div className={`flex items-center gap-2 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-medium">
            {isUser ? (userName || t('chat.you')) : `${t('chat.aiAssistant')}`}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isUser ? new Date(message.createdAt).toLocaleDateString() : (message.model ? ` ${getModelDisplayName(message.model)} ` : '')}
          </span>
          {message.isStreaming && (
            <span className="text-xs text-blue-500 dark:text-blue-400">
              {t('thinking')}
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
        
        {/* Action Bar for Assistant Messages */}
        {!isUser && message.content && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(message.content)}
              className="h-8 w-8"
              title={t('copyMessage')}
            >
              <Copy className="h-4 w-4" />
            </Button>

            {/* Export Chat Button - only show on last assistant message */}
            {isLastAssistantMessage && onExportChat && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onExportChat}
                      disabled={isExporting}
                      className="h-8 w-8"
                    >
                      {isExporting ? (
                        <Download className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{t('chat.exportChatTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
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

function ChatMessagesComponent({ messages, userImageUrl, userName, onExportChat }: ChatMessagesProps) {
  const t = useTranslations('assistant')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const lastMessageCountRef = useRef(messages.length)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Find the last assistant message
  const lastAssistantMessageIndex = messages.map((m, idx) => ({ role: m.role, idx }))
    .filter(m => m.role === Role.ASSISTANT)
    .pop()?.idx

  // Wrap export handler to manage loading state
  const handleExport = useCallback(async () => {
    if (!onExportChat || isExporting) return
    setIsExporting(true)
    try {
      await onExportChat()
    } finally {
      setIsExporting(false)
    }
  }, [onExportChat, isExporting])

  // Handle scroll position detection with improved threshold
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isInitialLoad) return
    
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    // More lenient threshold for "at bottom" detection
    const isAtBottom = distanceFromBottom < 50
    
    setShowScrollButton(!isAtBottom && distanceFromBottom > 200)
    // Only mark as "user scrolled" if they're meaningfully away from bottom
    setUserHasScrolled(distanceFromBottom > 150)
  }, [isInitialLoad])

  // Scroll to bottom function with optional instant scroll
  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: instant ? 'instant' : 'smooth',
      block: 'end'
    })
    setUserHasScrolled(false)
  }, [])

  // Initial scroll to bottom when chat loads with messages
  useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToBottom(true) // Instant scroll on initial load
        setIsInitialLoad(false)
      })
    }
  }, [isInitialLoad, messages.length, scrollToBottom])

  // Auto-scroll for new messages and streaming
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoad) return
    
    const lastMessage = messages[messages.length - 1]
    const messageCountIncreased = messages.length > lastMessageCountRef.current
    const isStreaming = lastMessage?.isStreaming
    
    // Auto-scroll if:
    // 1. A new user message was added
    // 2. AI is streaming and user hasn't scrolled away
    // 3. User hasn't manually scrolled away from bottom
    if (!userHasScrolled) {
      if (messageCountIncreased && lastMessage?.role === Role.USER) {
        scrollToBottom()
      } else if (isStreaming && lastMessage?.role !== Role.USER) {
        // Smooth scroll during streaming
        scrollToBottom()
      }
    }
    
    lastMessageCountRef.current = messages.length
  }, [messages, userHasScrolled, scrollToBottom, isInitialLoad])

  // Set up scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    
    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (messages.length === 0) {
    return (
      <div className="h-full overflow-auto no-scrollbar">
        <div className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-lg">{t('startConversation')}</p>
            <p className="text-sm">{t('startConversationSubtext')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={scrollContainerRef} className="h-full overflow-auto no-scrollbar">
        <div className="p-4 space-y-6">
          {messages.map((message, idx) => (
            <MessageBubble
              key={message.id}
              message={message}
              userImageUrl={userImageUrl}
              userName={userName}
              isLastAssistantMessage={idx === lastAssistantMessageIndex}
              onExportChat={handleExport}
              isExporting={isExporting}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Scroll to bottom button */}
      <div 
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
          showScrollButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Button
          onClick={() => scrollToBottom()}
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg bg-background/95 backdrop-blur"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export const ChatMessages = memo(ChatMessagesComponent)