'use client'

import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckIcon,
  CrownIcon,
  Megaphone,
  PenTool,
  Shield,
  Sparkles,
  StarIcon,
  Target,
  Zap,
  ZapIcon
} from 'lucide-react'
import Image from 'next/image'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {ThemeToggle} from '@/components/global/theme-toggle'
import {getPlanNameColor} from '@/lib/subscription/subscription-plan-utils'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import Link from 'next/link'
import {SubscriptionPlan} from "@prisma/client";

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
          {/* Logo - Centered */}
          <div className="mb-8 flex justify-center">
            <Image 
              src="/mia_logo.svg" 
              alt="MIA - Millennials Influencers Assistant" 
              width={350}
              height={350}
              className="max-w-xs md:max-w-sm"
            />
          </div>
          

          <p className="text-xl text-gray-800 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Create personalized marketing content with an AI that understands your clients' business context.
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
        <div className="mb-8">
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
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Enterprise-grade privacy and security
            </span>
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

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your marketing needs. All plans include access to both Google Gemini 2.0 and OpenAI GPT-4.1.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => {
              const getPlanIcon = (planId: string) => {
                switch (planId) {
                  case SubscriptionPlan.basic: return <ZapIcon className="h-8 w-8" />
                  case SubscriptionPlan.pro: return <StarIcon className="h-8 w-8" />
                  case SubscriptionPlan.business: return <CrownIcon className="h-8 w-8" />
                  default: return <ZapIcon className="h-8 w-8" />
                }
              }
              
              return (
                <Card key={planId} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader className="text-center flex-1">
                    <div className="flex justify-center mb-4">
                      {getPlanIcon(planId)}
                    </div>
                    <CardTitle className={`text-2xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
                    <CardDescription className="text-sm min-h-[3rem] flex items-center justify-center">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}€</span>
                      {plan.price > 0 && <span className="text-gray-500">/month</span>}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features_list.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to Create?
          </h2>
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
            <p>&copy; 2025 MIA. AI-powered marketing content generation platform.</p>
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