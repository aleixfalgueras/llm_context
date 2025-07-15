'use client'

import {useState} from 'react'
import {useUser} from '@clerk/nextjs'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {CheckIcon, CrownIcon, SettingsIcon, StarIcon, ZapIcon} from 'lucide-react'
import {isDowngrade as checkIsDowngrade, SUBSCRIPTION_PLANS} from '@/lib/payments/subscription-utils'
import {SubscriptionPlan} from '@/types/subscription-types'
import {useSubscription} from '@/hooks/use-subscription'
import {Navbar} from '@/components/global/navbar'
import {useToast} from '@/hooks/use-toast'
import {ToastVariant} from '@/types/enums'
import {UpgradeConfirmationDialog} from '@/components/subscription/upgrade-confirmation-dialog'


export default function SubscriptionPage() {
  const { user: _user } = useUser()
  const subscription = useSubscription()
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    targetPlan: SubscriptionPlan | null
  }>({ isOpen: false, targetPlan: null })
  const { toast } = useToast()

  const handleUpgrade = (planId: string) => {
    // Show confirmation dialog instead of immediately upgrading
    setConfirmationDialog({
      isOpen: true,
      targetPlan: planId as SubscriptionPlan
    })
  }

  const handleConfirmUpgrade = async () => {
    if (!confirmationDialog.targetPlan) return

    const planId = confirmationDialog.targetPlan
    setUpgradeLoading(planId)
    
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingInterval: 'monthly' })
      })
      
      if (response.ok) {
        const { data } = await response.json()
        
        // Handle downgrades vs upgrades with unified response
        if (data.isDowngrade) {
          // Downgrade was scheduled - show success message
          toast({
            title: 'Downgrade Scheduled',
            description: data.message || 'Your plan will be downgraded at the end of your current billing period.',
            variant: ToastVariant.DEFAULT
          })
        } else {
          // Redirect to checkout for upgrades/new subscriptions
          if (data.url) {
            window.location.href = data.url
          } else {
            throw new Error('No checkout URL received')
          }
        }
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: ToastVariant.DESTRUCTIVE
      })
    } finally {
      setUpgradeLoading(null)
      setConfirmationDialog({ isOpen: false, targetPlan: null })
    }
  }

  const handleCloseConfirmation = () => {
    setConfirmationDialog({ isOpen: false, targetPlan: null })
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/subscription/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const { data: { url } } = await response.json()
        window.location.href = url
      } else if (response.status === 404) {
        toast({
          title: 'Free Trial Period',
          description: "You're currently in your free trial period. No subscription has been created yet. Upgrade to a paid plan to manage your subscription.",
          variant: ToastVariant.DEFAULT
        })
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error accessing customer portal:', error)
      toast({
        title: 'Error',
        description: 'Failed to access subscription management. Please try again.',
        variant: ToastVariant.DESTRUCTIVE
      })
    } finally {
      setPortalLoading(false)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case SubscriptionPlan.BASIC: return <ZapIcon className="h-6 w-6" />
      case SubscriptionPlan.PRO: return <StarIcon className="h-6 w-6" />
      case SubscriptionPlan.BUSINESS: return <CrownIcon className="h-6 w-6" />
      default: return <ZapIcon className="h-6 w-6" />
    }
  }

  const getButtonText = (planId: string) => {
    const isCurrentPlan = planId === subscription.plan
    
    if (isCurrentPlan) {
      return 'Current Plan'
    }
    
    const planNames = {
      [SubscriptionPlan.BASIC]: 'Basic',
      [SubscriptionPlan.PRO]: 'Pro',
      [SubscriptionPlan.BUSINESS]: 'Business'
    }
    
    // Check if this is a downgrade
    if (checkIsDowngrade(subscription.plan as SubscriptionPlan, planId as SubscriptionPlan)) {
      return `Downgrade to ${planNames[planId as keyof typeof planNames]}`
    }
    
    // Special case for Basic plan - show free trial message for new users
    if (planId === SubscriptionPlan.BASIC) {
      return 'First 2 Weeks Free 🚀'
    }
    
    // For upgrades
    return `Upgrade to ${planNames[planId as keyof typeof planNames]}`
  }

  const isUpgrade = (planId: string) => {
    const planOrder = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.BUSINESS]
    const currentIndex = planOrder.indexOf(subscription.plan as SubscriptionPlan)
    const targetIndex = planOrder.indexOf(planId as SubscriptionPlan)
    return targetIndex > currentIndex
  }

  const isCurrentPlan = (planId: string) => planId === subscription.plan

  const getPlanBadge = (planId: string) => {
    const isCurrentPlan = planId === subscription.plan
    
    if (isCurrentPlan) {
      return <Badge className="bg-green-500">Current Plan</Badge>
    }
    
    return null
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16 relative">
          {/* Manage Subscription Link - Top Right */}
          <div className="absolute top-0 right-0">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleManageSubscription()
              }}
              className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline transition-colors ${
                portalLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </a>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Start with our Basic plan (first 2 weeks free). Upgrade when you need more. 🚀
          </p>
          
          {/* Current Subscription Status */}
          {subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                subscription.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <span className="font-medium">
                  {subscription.isActive ? 'Active' : 'Expired'} - 
                  {subscription.isActive ? ' Expires' : ' Expired'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
            <Card 
              key={planId} 
              className={`relative ${
                isCurrentPlan(planId) 
                  ? 'border-green-500 shadow-lg scale-105 bg-green-50 dark:bg-green-900/20' 
                  : ''
              }`}
            >
              <CardHeader className="text-center">
                {getPlanBadge(planId)}
                <div className="flex justify-center mb-4">
                  {getPlanIcon(planId)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
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
                  disabled={upgradeLoading === plan.id || isCurrentPlan(planId)}
                  className="w-full"
                  variant={isCurrentPlan(planId) ? 'secondary' : (plan.id === SubscriptionPlan.PRO ? 'default' : 'outline')}
                >
                  {upgradeLoading === plan.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    getButtonText(planId)
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
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

      {/* Upgrade Confirmation Dialog */}
      <UpgradeConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmUpgrade}
        targetPlan={confirmationDialog.targetPlan || SubscriptionPlan.BASIC}
        billingInterval="monthly"
        isLoading={upgradeLoading !== null}
        hasActiveSubscription={!!subscription.stripeSubscriptionId}
        isDowngrade={confirmationDialog.targetPlan ? checkIsDowngrade(subscription.plan as SubscriptionPlan, confirmationDialog.targetPlan) : false}
      />
    </div>
  )
} 