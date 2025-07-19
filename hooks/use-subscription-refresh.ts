import {useState, useEffect, useRef} from 'react'
import {useSubscription} from '@/hooks/use-subscription'
import {useToast} from '@/hooks/use-toast'
import {ToastVariant} from '@/types/enums'

export function useSubscriptionRefresh() {
  const subscription = useSubscription()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const wasPreviouslyBlurred = useRef(false)

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

  return {
    isRefreshing,
    setIsRefreshing,
    refreshSubscriptionWithFallback
  }
}