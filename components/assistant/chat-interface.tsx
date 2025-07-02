'use client'

import { Bot, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function ChatInterface() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-4">AI Chat Assistant</h1>
      </div>
      
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