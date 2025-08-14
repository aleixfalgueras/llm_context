'use client'

import {Bot, Shield, Users, Plus} from 'lucide-react'
import {Card} from '@/components/ui/card'
import {Button} from '@/components/ui/button'

interface ChatInterfaceProps {
  onStartGeneralChat?: () => void
  isCreatingGeneralChat?: boolean
}

export function ChatInterface({ onStartGeneralChat, isCreatingGeneralChat = false }: ChatInterfaceProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">AI Chat Assistant</h1>
      </div>
      
      {/* Get Started Options */}
      <Card className="mx-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-center mb-3">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">Get Started</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
            Start chatting immediately or select a client for personalized context ➡️
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              onClick={onStartGeneralChat}
              disabled={isCreatingGeneralChat}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingGeneralChat ? 'Starting...' : 'New Chat'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Privacy Notice */}
      <Card className="mx-4 mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center mb-2">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
          <h3 className="font-semibold text-green-800 dark:text-green-300">Privacy Protected</h3>
        </div>
        <p className="text-sm text-green-700 dark:text-green-400">
          We only share selected client information (country, general context) with AI -
          no names, emails, or phone numbers are included in the context.
        </p>
      </Card>
    </div>
  )
} 