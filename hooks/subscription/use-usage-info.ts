'use client'

import { useEffect, useState, useCallback } from 'react'
import { UsageInfo } from '@/lib/types/subscription-usage-types'
import { clientLogger } from '@/lib/client-logger'

export function useUsageInfo() {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageInfo = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = forceRefresh 
        ? `/api/subscription/usage-info?t=${Date.now()}`
        : '/api/subscription/usage-info'
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.data || responseData
        setUsageInfo(data)
        clientLogger.debug('Usage info fetched successfully', { 
          metadata: { 
            usedCost: data.subscriptionUsage.usage.cost_usd,
            limit: data.subscriptionUsage.subscription.spending_limit_usd 
          } 
        })
      } else {
        const errorText = await response.text()
        setError(`Failed to fetch usage info: ${errorText}`)
        clientLogger.error(`Failed to fetch usage info: ${response.status}, ${errorText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      clientLogger.error(`Error fetching usage info: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    await fetchUsageInfo(true)
  }, [fetchUsageInfo])

  useEffect(() => {
    void fetchUsageInfo()
  }, [fetchUsageInfo])

  return {
    usageInfo,
    isLoading,
    error,
    refetch
  }
}