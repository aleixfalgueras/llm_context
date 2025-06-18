'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

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
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {message.role === 'ASSISTANT' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Custom styling for code blocks
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <code
                              className={`${className} block bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto text-sm`}
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        // Custom styling for blockquotes
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-950/20 py-2 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        // Custom styling for tables
                        table: ({ children }) => (
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {children}
                          </td>
                        ),
                        // Ensure links open in new tab
                        a: ({ href, children }) => (
                          <a 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message.content}</p>
                  )}
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