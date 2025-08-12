import {useState, useEffect, useRef} from 'react'
import {useToast} from '@/hooks/use-toast'
import {ToastVariant} from '@/lib/types/enums'

interface UseSubscriptionRefreshProps {
  refetch: (retries?: number, delay?: number, forceRefresh?: boolean) => Promise<boolean>
}

export function useSubscriptionRefresh({ refetch }: UseSubscriptionRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  const wasPreviouslyBlurred = useRef(false)

  // Helper function to refresh subscription with error handling
  const refreshSubscriptionWithFallback = async (withDelay: boolean = false) => {
    setIsRefreshing(true)
    try {
      // Wait for database changes to propagate if requested
      if (withDelay) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      await refetch(3, 1000, true)
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
          try {
            await refreshSubscriptionWithFallback(true)
          } catch (error) {
            console.error('Failed to refresh subscription:', error)
            toast({
              title: 'Sync Error',
              description: 'Failed to refresh subscription data. Please try again.',
              variant: ToastVariant.DESTRUCTIVE
            })
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
  }, [refetch, toast])

  return {
    isRefreshing,
    setIsRefreshing,
    refreshSubscriptionWithFallback
  }
}