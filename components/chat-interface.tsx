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
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Start a conversation with our AI assistant. Ask questions, get help, or just chat!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <MessageSquare className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold mb-2">Natural Conversations</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Have natural, flowing conversations with our advanced AI assistant.
          </p>
        </Card>
        <Card className="p-6">
          <Bot className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold mb-2">Intelligent Responses</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Get thoughtful, context-aware responses to your questions and prompts.
          </p>
        </Card>
      </div>

      <p className="text-gray-500 dark:text-gray-400">
        Click "New Chat" in the sidebar to start your first conversation.
      </p>
    </div>
  )
} 