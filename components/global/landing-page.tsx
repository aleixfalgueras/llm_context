'use client'

import { Bot, MessageSquare, Zap, Shield, Sparkles, ArrowRight, Megaphone, Target, TrendingUp, BarChart3, PenTool } from 'lucide-react'
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
          {/* Logo space can be used for icon or kept empty */}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/pricing">Pricing</Link>
          </Button>
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
          {/* Brand Name - Centered */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              SpeedBrand
            </h1>
          </div>
          

          <p className="text-xl text-gray-800 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Create personalized marketing content 
            <br />
            with an AI that understands your clients' business context.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Advanced AI Marketing Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Business Intelligence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Store industry insights, business goals, target audiences, and competitive landscape for each client
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Campaign Strategy AI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate marketing strategies, campaign ideas, and tactical plans using deep client context
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-purple-200 dark:hover:border-purple-800">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Branded Content Creation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create on-brand content that speaks to your client's audience using their voice and messaging
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-orange-200 dark:hover:border-orange-800">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Client Reporting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate comprehensive client reports and campaign summaries with full business context
              </p>
            </Card>
          </div>
        </div>
        
        {/* AI Models Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Dual Premium AI Models Available</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All subscription tiers include both Google Gemini 2.0 and OpenAI GPT-4.1 through our unified OpenRouter platform. Identical pricing, maximum flexibility.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Google Gemini 2.0</h3>
              <div className="mb-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
                1M Context Length
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Latest Google AI with enhanced reasoning, multimodal capabilities, and superior performance for complex marketing strategies.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">OpenAI GPT-4.1</h3>
              <div className="mb-4 text-sm text-green-600 dark:text-green-400 font-medium">
                200K Context Length
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Efficient OpenAI model perfect for creative campaign content, strategic planning, and versatile marketing copy.
              </p>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Switch between models seamlessly
              </span>
            </div>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">From Client Onboarding to Campaign Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Capture Client Intelligence</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Store each client's industry, target market, brand voice, competitive landscape, and business objectives in one organized system.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Marketing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate campaign strategies, content, and marketing materials that are perfectly tailored to each client's unique business context and goals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Deliver Results</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Present campaigns that truly understand your client's market, speak to their audience, and align with their business objectives.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-16 border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Targeted</div>
              <div className="text-gray-600 dark:text-gray-400">Campaign Creation</div>
              <div className="text-sm text-gray-500">Based on real client data</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">Scalable</div>
              <div className="text-gray-600 dark:text-gray-400">Client Management</div>
              <div className="text-sm text-gray-500">Handle more clients efficiently</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">Strategic</div>
              <div className="text-gray-600 dark:text-gray-400">Marketing Intelligence</div>
              <div className="text-sm text-gray-500">Data-driven decisions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">Professional</div>
              <div className="text-gray-600 dark:text-gray-400">Client Deliverables</div>
              <div className="text-sm text-gray-500">Impress every client</div>
            </div>
          </div>
        </div>

        {/* Technology Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Enterprise Privacy</h3>
            <p className="text-gray-600 dark:text-gray-400">
              GDPR-compliant with granular client context selection. Your data never leaves your control with privacy-first design.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Latest AI Technology</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Access to cutting-edge Google and OpenAI models through unified OpenRouter platform with business-sustainable pricing.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow border-2 hover:border-purple-200 dark:hover:border-purple-800">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Modular Architecture</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enterprise-grade system with clean separation of concerns, comprehensive error handling, and real-time usage tracking.
            </p>
          </Card>
        </div>
        
        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Choose Your AI Provider?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join marketing professionals using both Google Gemini 2.0 and OpenAI GPT-4.1 to create better campaigns with maximum flexibility and business sustainability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Start Free Trial
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
            <p>&copy; 2025 SpeedBrand. Intelligent campaign creation for marketing professionals.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-4">
                Pricing
              </Link>
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