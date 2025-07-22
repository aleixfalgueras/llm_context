'use client'

import {useState, useEffect} from 'react'
import {useSearchParams, useRouter} from 'next/navigation'
import {useToast} from '@/hooks/use-toast'
import {ToastVariant} from '@/types/enums'
import {useSubscription} from "@/hooks/subscription/use-subscription";

// Helper function to clean up URL parameters
function cleanupUrlParams(paramNames: string[], router: ReturnType<typeof useRouter>) {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    paramNames.forEach(param => url.searchParams.delete(param))
    router.replace(url.pathname, { scroll: false })
  }
}

interface SubscriptionUrlHandlerProps {
  subscription: ReturnType<typeof useSubscription>
  toast: ReturnType<typeof useToast>['toast']
  setIsRefreshing: (refreshing: boolean) => void
}

export function SubscriptionUrlHandler({ subscription, toast, setIsRefreshing }: SubscriptionUrlHandlerProps) {
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