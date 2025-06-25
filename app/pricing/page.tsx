'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, StarIcon, CrownIcon, ZapIcon } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-utils'



export default function PricingPage() {
  const { user } = useUser()
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    setUpgradeLoading(planId)
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setUpgradeLoading(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <ZapIcon className="h-6 w-6" />
      case 'pro': return <StarIcon className="h-6 w-6" />
      case 'business': return <CrownIcon className="h-6 w-6" />
      default: return <ZapIcon className="h-6 w-6" />
    }
  }

  const getPlanBadge = (planId: string) => {
    if (planId === 'pro') return <Badge className="bg-blue-500">Most Popular</Badge>
    if (planId === 'business') return <Badge className="bg-purple-500">Enterprise</Badge>
    return null
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Scale your marketing efforts with AI-powered assistance. Start with our Basic plan (first month free), upgrade when you need more.
          </p>
        </div>



        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <Card 
              key={planId} 
              className={`relative ${planId === 'pro' ? 'border-blue-500 shadow-lg scale-105' : ''}`}
            >
              <CardHeader className="text-center">
                {getPlanBadge(planId)}
                <div className="flex justify-center mb-4">
                  {getPlanIcon(planId)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/month</span>}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features_list.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgradeLoading === plan.id}
                  className="w-full"
                  variant={plan.id === 'pro' ? 'default' : 'outline'}
                >
                  {upgradeLoading === plan.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    planId === 'basic' ? 'First Month Free 🚀' : 'Upgrade Now')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                  and you'll be charged or credited proportionally.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You'll be notified when approaching your limits and prompted to upgrade. 
                  We won't charge extra - your usage will be paused until the next billing cycle or until you upgrade.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is my data secure?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely. We're fully GDPR compliant with enterprise-grade security. 
                  Your client data is encrypted and never shared with third parties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 