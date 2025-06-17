'use client'

import { Bot, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function ChatInterface() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">AI Chat Assistant</h1>
        <p className="mx-2 text-gray-600 dark:text-gray-300 text-lg">
          Get thoughtful, context-aware responses to your questions and prompts using our AI assistant.
        </p>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        Click "New Chat" in the sidebar to start your first conversation.
      </p>
    </div>
  )
} 