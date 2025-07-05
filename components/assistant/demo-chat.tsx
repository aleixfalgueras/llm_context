'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import Image from 'next/image'

const demoMessages = [
  {
    role: 'user',
    content: 'How can AI help me with my work?',
    delay: 0
  },
  {
    role: 'assistant',
    content: 'AI can help boost your productivity in many ways! I can assist with writing, coding, research, brainstorming, and problem-solving. What kind of work do you do?',
    delay: 1500
  },
  {
    role: 'user',
    content: 'I\'m a content creator and need help with ideas',
    delay: 3000
  },
  {
    role: 'assistant',
    content: 'Perfect! I can help you brainstorm content ideas, write engaging captions, plan content calendars, analyze trends, and even help with SEO optimization. What type of content do you create?',
    delay: 4500
  }
]

export function DemoChat() {
  const [visibleMessages, setVisibleMessages] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleMessages(prev => {
        if (prev < demoMessages.length) {
          return prev + 1
        } else {
          // Reset after showing all messages
          setTimeout(() => setVisibleMessages(0), 2000)
          return prev
        }
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-xl">
      <div className="space-y-4 h-80 overflow-hidden">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          ✨ Live Demo - See AI in Action
        </div>
        
        {demoMessages.slice(0, visibleMessages).map((message, index) => (
          <div key={index} className="flex gap-3 animate-in slide-in-from-bottom duration-500">
            <Avatar className="w-8 h-8">
              {message.role === 'user' ? (
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-black dark:bg-white">
                  <Image
                    src="/openai-logo.svg"
                    alt="AI"
                    width={16}
                    height={16}
                    className="w-4 h-4 invert-0 dark:invert"
                  />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {message.content}
              </p>
            </div>
          </div>
        ))}
        
        {visibleMessages < demoMessages.length && visibleMessages > 0 && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-black dark:bg-white">
                <Image
                  src="/openai-logo.svg"
                  alt="AI"
                  width={16}
                  height={16}
                  className="w-4 h-4 invert-0 dark:invert"
                />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
} 