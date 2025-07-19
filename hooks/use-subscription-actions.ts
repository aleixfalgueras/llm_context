import {useState} from 'react'
import {useToast} from '@/hooks/use-toast'
import {SubscriptionPlan} from '@/types/subscription-types'
import {ToastVariant} from '@/types/enums'

interface UseSubscriptionActionsProps {
  refreshSubscriptionWithFallback: () => Promise<void>
}

export function useSubscriptionActions({ refreshSubscriptionWithFallback }: UseSubscriptionActionsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const [cancelDowngradeLoading, setCancelDowngradeLoading] = useState(false)
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

  const handlePlanAction = (planId: string, isPendingDowngrade: boolean, isPendingPlanChange: boolean) => {
    // Check if this plan is the target of a pending downgrade
    if (isPendingDowngrade && isPendingPlanChange) {
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

  return {
    upgradeLoading,
    cancelDowngradeLoading,
    portalLoading,
    confirmationDialog,
    handleUpgrade,
    handlePlanAction,
    handleConfirmUpgrade,
    handleCloseConfirmation,
    handleManageSubscription,
    handleCancelDowngrade
  }
}