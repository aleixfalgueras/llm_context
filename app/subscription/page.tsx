'use client'

import {useState, useEffect, Suspense, useRef} from 'react'
import {useSearchParams, useRouter} from 'next/navigation'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {CheckIcon, CrownIcon, SettingsIcon, StarIcon, ZapIcon} from 'lucide-react'
import {isDowngrade as checkIsDowngrade, getPlanNameColor} from '@/lib/subscription/subscription-client-utils'
import {SUBSCRIPTION_PLAN_DETAIL, SubscriptionPlan} from '@/types/subscription-types'
import {useSubscription} from '@/hooks/use-subscription'
import {Navbar} from '@/components/global/navbar'
import {useToast} from '@/hooks/use-toast'
import {ToastVariant} from '@/types/enums'
import {UpgradeConfirmationDialog} from '@/components/subscription/upgrade-confirmation-dialog'

// Helper function to clean up URL parameters
function cleanupUrlParams(paramNames: string[], router: ReturnType<typeof useRouter>) {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    paramNames.forEach(param => url.searchParams.delete(param))
    router.replace(url.pathname, { scroll: false })
  }
}

// Component to handle URL parameters (needs to be wrapped in Suspense)
function SubscriptionUrlHandler({ subscription, toast, setIsRefreshing }: { 
  subscription: ReturnType<typeof useSubscription>
  toast: ReturnType<typeof useToast>['toast']
  setIsRefreshing: (refreshing: boolean) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [refreshingAfterSuccess, setRefreshingAfterSuccess] = useState(false)

  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true'
    const isCanceled = searchParams.get('canceled') === 'true'
    
    if (isSuccess && !refreshingAfterSuccess) {
      console.log('💰 Payment success detected - starting subscription refresh')
      setRefreshingAfterSuccess(true)
      setIsRefreshing(true)
      
      let pollInterval: NodeJS.Timeout | null = null
      
      // Add a small delay before first refresh to allow webhooks to process
      setTimeout(() => {
        console.log('🔄 Starting subscription refresh with cache bypass')
        // Immediate refresh with cache bypass
        subscription.refetch(3, 1000, true).then(() => {
          toast({
            title: 'Subscription Updated!',
            description: 'Your subscription has been successfully updated.',
            variant: ToastVariant.SUCCESS
          })
        })
        
        // Polling for webhook updates (every 2 seconds for 10 seconds) with cache bypass
        let pollCount = 0
        const maxPolls = 5
        pollInterval = setInterval(async () => {
          pollCount++
          await subscription.refetch(3, 1000, true)
          
          if (pollCount >= maxPolls) {
            if (pollInterval) {
              clearInterval(pollInterval)
            }
            setRefreshingAfterSuccess(false)
            setIsRefreshing(false)
          }
        }, 2000)
      }, 1000) // 1 second delay
      
      // Clean up URL parameters
      cleanupUrlParams(['success'], router)
      
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval)
        }
      }
    }
    
    if (isCanceled) {
      toast({
        title: 'Payment Canceled',
        description: 'Your subscription update was canceled.',
        variant: ToastVariant.DEFAULT
      })
      
      // Clean up URL parameters
      cleanupUrlParams(['canceled'], router)
    }
  }, [searchParams, refreshingAfterSuccess, subscription, router, toast])

  return null // This component only handles side effects
}

export default function SubscriptionPage() {
  const subscription = useSubscription()
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const [cancelDowngradeLoading, setCancelDowngradeLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    targetPlan: SubscriptionPlan | null
  }>({ isOpen: false, targetPlan: null })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const wasPreviouslyBlurred = useRef(false)

  // Helper function to calculate remaining days from end date
  const calculateRemainingDays = (endDate: string | Date | null | undefined): number => {
    if (!endDate) return 0
    
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // Helper function to detect if user is in free mode
  const isFreeMode = () => {
    return subscription.plan === SubscriptionPlan.BASIC && !subscription.stripeSubscriptionId
  }

  // Helper function to calculate remaining trial days
  const getRemainingTrialDays = () => {
    if (!isFreeMode()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to detect if subscription is active but marked for cancellation
  const isActiveCancelled = () => {
    return !isFreeMode() && subscription.isActive && subscription.cancelAtPeriodEnd
  }

  // Helper function to calculate remaining days until cancellation
  const getRemainingActiveDays = () => {
    if (!isActiveCancelled()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to detect if subscription has pending downgrade
  const isPendingDowngrade = () => {
    return Boolean(!isFreeMode() && subscription.isActive && subscription.pendingPlanChange && !subscription.cancelAtPeriodEnd)
  }

  // Helper function to safely check if a plan matches the pending change
  const isPendingPlanChange = (planId: string): boolean => {
    return Boolean(subscription.pendingPlanChange && subscription.pendingPlanChange !== "" && subscription.pendingPlanChange === planId)
  }

  // Helper function to calculate remaining days until downgrade
  const getRemainingDowngradeDays = () => {
    if (!isPendingDowngrade()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to refresh subscription with error handling
  const refreshSubscriptionWithFallback = async () => {
    setIsRefreshing(true)
    try {
      await subscription.refetch(3, 1000, true)
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Helper function to safely capitalize plan name
  const capitalizePlanName = (planName: string | undefined) => {
    if (!planName) return 'Unknown'
    return planName.charAt(0).toUpperCase() + planName.slice(1)
  }

  // Tab focus detection for Customer Portal return
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout

    const handleFocus = () => {
      // Only refresh if the tab was previously blurred (not on initial page load)
      if (wasPreviouslyBlurred.current) {
        // Clear any existing timer
        clearTimeout(debounceTimer)
        
        // Debounce the refresh to prevent excessive API calls
        debounceTimer = setTimeout(async () => {
          setIsRefreshing(true)
          
          try {
            // Store current state before refresh
            const previousState = {
              plan: subscription.plan,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              pendingPlanChange: subscription.pendingPlanChange
            }
            
            await subscription.refetch()
            
            // Check if anything important changed
            const hasChanges = 
              previousState.plan !== subscription.plan ||
              previousState.status !== subscription.status ||
              previousState.cancelAtPeriodEnd !== subscription.cancelAtPeriodEnd ||
              previousState.pendingPlanChange !== subscription.pendingPlanChange
            
            // Only show toast if there were actual changes
            if (hasChanges) {
              toast({
                title: 'Subscription Updated',
                description: 'Your subscription changes have been synchronized.',
                variant: ToastVariant.SUCCESS
              })
            }
          } catch (error) {
            console.error('Failed to refresh subscription:', error)
            toast({
              title: 'Sync Error',
              description: 'Failed to refresh subscription data. Please try again.',
              variant: ToastVariant.DESTRUCTIVE
            })
          } finally {
            setIsRefreshing(false)
          }
        }, 500) // 500ms debounce delay
      }
    }

    const handleBlur = () => {
      wasPreviouslyBlurred.current = true
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      clearTimeout(debounceTimer)
    }
  }, [subscription, toast])


  const handleUpgrade = (planId: string) => {
    // Show confirmation dialog instead of immediately upgrading
    setConfirmationDialog({
      isOpen: true,
      targetPlan: planId as SubscriptionPlan
    })
  }

  const handlePlanAction = (planId: string) => {
    // Check if this plan is the target of a pending downgrade
    if (isPendingDowngrade() && isPendingPlanChange(planId)) {
      handleCancelDowngrade()
    } else {
      handleUpgrade(planId)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!confirmationDialog.targetPlan) return

    const planId = confirmationDialog.targetPlan
    setUpgradeLoading(planId)
    
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      
      if (response.ok) {
        const { data } = await response.json()
        
        // Handle downgrades vs upgrades with unified response
        if (data.isDowngrade) {
          // Downgrade was scheduled - show success message and refresh subscription
          toast({
            title: 'Downgrade Scheduled',
            description: data.message || 'Your plan will be downgraded at the end of your current billing period.',
            variant: ToastVariant.DEFAULT
          })
          
          // Refresh subscription to show updated state
          await refreshSubscriptionWithFallback()
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
        window.open(url, '_blank')
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

  const handleCancelDowngrade = async () => {
    setCancelDowngradeLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel-downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const { data } = await response.json()
        
        toast({
          title: 'Downgrade Canceled',
          description: data.message || 'Your scheduled downgrade has been canceled successfully.',
          variant: ToastVariant.SUCCESS
        })
        
        // Refresh subscription to show updated state
        await refreshSubscriptionWithFallback()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to cancel downgrade')
      }
    } catch (error) {
      console.error('Error canceling downgrade:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel downgrade. Please try again.',
        variant: ToastVariant.DESTRUCTIVE
      })
    } finally {
      setCancelDowngradeLoading(false)
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


  // Plan names constant
  const PLAN_NAMES = {
    [SubscriptionPlan.BASIC]: 'Basic',
    [SubscriptionPlan.PRO]: 'Pro',
    [SubscriptionPlan.BUSINESS]: 'Business'
  }

  // Loading spinner component
  const LoadingSpinner = ({ text = 'Loading...' }: { text?: string }) => (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      {text}
    </div>
  )

  // Helper function to get button styles based on plan state
  const getButtonStyles = (planId: string, isCurrentPlan: boolean, isPendingDowngrade: boolean, isPendingPlanChange: boolean) => {
    if (isCurrentPlan) {
      return 'bg-gray-500 hover:bg-gray-600 text-white'
    }
    if (isPendingDowngrade && isPendingPlanChange) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
    }
    if (isPendingDowngrade && !isPendingPlanChange) {
      return 'bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed'
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
  }

  const getButtonText = (planId: string) => {
    
    // Free mode users see "Subscribe to..." for all plans
    if (isFreeMode()) {
      return `Subscribe to ${PLAN_NAMES[planId as keyof typeof PLAN_NAMES]}`
    }
    
    // Check if this plan is the target of a pending downgrade
    if (isPendingDowngrade() && isPendingPlanChange(planId)) {
      return 'Cancel Downgrade'
    }
    
    // Check if this is the current plan (for paid users)
    if (isCurrentPlan(planId)) {
      return 'Current Plan'
    }
    
    // If there's a pending downgrade and this is not the target plan, show blocked state
    if (isPendingDowngrade()) {
      return `${PLAN_NAMES[planId as keyof typeof PLAN_NAMES]} (Blocked)`
    }
    
    // Check if this is a downgrade
    if (checkIsDowngrade(subscription.plan as SubscriptionPlan, planId as SubscriptionPlan)) {
      return `Downgrade to ${PLAN_NAMES[planId as keyof typeof PLAN_NAMES]}`
    }
    
    // For upgrades
    return `Upgrade to ${PLAN_NAMES[planId as keyof typeof PLAN_NAMES]}`
  }

  const isCurrentPlan = (planId: string) => {
    // Free mode users don't have a "current plan" - they're in trial
    if (isFreeMode()) {
      return false
    }
    return planId === subscription.plan
  }

  const getPlanBadge = (planId: string) => {
    // Free mode users don't get a "Current Plan" badge
    if (isFreeMode()) {
      return null
    }
    
    if (isCurrentPlan(planId)) {
      return <Badge className="bg-green-500">Current Plan</Badge>
    }
    
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Suspense fallback={null}>
        <SubscriptionUrlHandler subscription={subscription} toast={toast} setIsRefreshing={setIsRefreshing} />
      </Suspense>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16 relative">
          {/* Manage Subscription Section - Top Right */}
          <div className="absolute top-0 right-0">
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
              
              {/* Updating Status Message */}
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>

          {/* Free Trial Banner */}
          {isFreeMode() && subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                <span className="font-semibold text-lg">
                  Free Trial Active (Basic Plan) - {getRemainingTrialDays()} days remaining
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Trial expires on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {/* Active Subscription Marked for Cancellation */}
          {isActiveCancelled() && subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                <span className="font-semibold text-lg">
                  Active Subscription (Cancelled) - {getRemainingActiveDays()} days remaining
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your subscription will be cancelled on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {/* Active Subscription Marked for Downgrade */}
          {isPendingDowngrade() && subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
                <span className="font-semibold text-lg">
                  Active Subscription (Downgrading) - {getRemainingDowngradeDays()} days until downgrade to {capitalizePlanName(subscription.pendingPlanChange)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your subscription will be downgraded on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {/* Current Subscription Status - Only show for paid subscriptions that are not marked for cancellation or downgrade */}
          {!isFreeMode() && !isActiveCancelled() && !isPendingDowngrade() && subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                subscription.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <span className="font-medium">
                  {subscription.isActive ? 'Active Subscription' : 'Expired Subscription'} - 
                  {subscription.isActive ? ' Renews' : ' Expired'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => (
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
                <CardTitle className={`text-2xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}€</span>
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
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={upgradeLoading === plan.id || cancelDowngradeLoading || isCurrentPlan(planId) || (isPendingDowngrade() && !isPendingPlanChange(planId))}
                  className={`w-full ${getButtonStyles(
                    planId,
                    isCurrentPlan(planId),
                    isPendingDowngrade(),
                    isPendingPlanChange(planId)
                  )}`}
                >
                  {upgradeLoading === plan.id ? (
                    <LoadingSpinner text="Processing..." />
                  ) : cancelDowngradeLoading && isPendingDowngrade() && isPendingPlanChange(planId) ? (
                    <LoadingSpinner text="Canceling..." />
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
                  Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately at full price. 
                  Downgrades take effect at the end of your current billing period.
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
        isLoading={upgradeLoading !== null}
        hasActiveSubscription={!!subscription.stripeSubscriptionId}
        isDowngrade={confirmationDialog.targetPlan ? checkIsDowngrade(subscription.plan as SubscriptionPlan, confirmationDialog.targetPlan) : false}
      />
    </div>
  )
} 