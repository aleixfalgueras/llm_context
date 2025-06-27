'use client'

import { Bot, MessageSquare, Zap, Shield, Sparkles, ArrowRight, Users, FileText, Edit, Megaphone, Video, Target, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/global/theme-toggle'
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">AI Context Manager</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-transparent bg-clip-text px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200">Works With Your Existing CRM - Salesforce, HubSpot & More</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
            AI Context Manager
            <br />
            for Your Clients
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Store essential client context for better AI interactions. Get more relevant, personalized responses by giving AI the business context it needs to understand your clients.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Start Creating Content Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Smart Client Context for Better AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Context Storage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Store essential client details that help AI understand your business relationships
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Context-Aware AI Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with AI using your client context for personalized, relevant conversations
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-purple-200 dark:hover:border-purple-800">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client-Specific Documents</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate documents using your stored client context for better relevance
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-orange-200 dark:hover:border-orange-800">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Contextual Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create meeting reports and summaries with your client's business context
              </p>
            </Card>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Simple AI Context Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Essential Client Context</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Store only the key information you need for AI interactions - business focus, industry, project notes, and communication style.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Uses Your Context</h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you chat with AI or generate content, it automatically uses your client context to provide more relevant, personalized responses.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Better AI Results</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get more accurate, relevant content and advice because AI understands your client's specific business context and needs.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-16 border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Smart</div>
              <div className="text-gray-600 dark:text-gray-400">Context Storage</div>
              <div className="text-sm text-gray-500">For better AI interactions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">AI-Ready</div>
              <div className="text-gray-600 dark:text-gray-400">Client Data</div>
              <div className="text-sm text-gray-500">Optimized for AI interactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">Essential</div>
              <div className="text-gray-600 dark:text-gray-400">Information Only</div>
              <div className="text-sm text-gray-500">Just what AI needs to know</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">Better</div>
              <div className="text-gray-600 dark:text-gray-400">AI Results</div>
              <div className="text-sm text-gray-500">Context-aware responses</div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your client data is protected with enterprise-grade security. No personal identifiers sent to AI.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Organized Content</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All generated content is automatically organized and stored for easy access and client delivery.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-purple-200 dark:hover:border-purple-800">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate comprehensive marketing content in seconds, not hours of manual work.
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Better AI Results with Client Context
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Transform your AI interactions by giving it the client context it needs. Store essential business information and get more relevant, personalized responses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Start Getting Better AI Results
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; 2024 AI Context Manager. Enhance your AI interactions with client context.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-4">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-4">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}