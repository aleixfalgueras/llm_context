'use client'

import { useState, useEffect } from 'react'
import { getTierFromPlan } from '@/lib/models-config'
import { ModelTier, SubscriptionPlan, ModelTierType, SubscriptionPlanType } from '@/types/subscription-types'

interface SubscriptionInfo {
  plan: SubscriptionPlanType
  tier: ModelTierType
  maxTokensPerMonth: number
  maxClients: number
  tokensUsed: number
  storageUsed: number
  storageUsedFormatted: string
  storageLimit: number
  storageLimitFormatted: string
  storageUsagePercentage: number
  isLoading: boolean
  // Subscription status
  status?: string
  currentPeriodEnd?: string
  isActive?: boolean
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: SubscriptionPlan.BASIC,
    tier: ModelTier.BASIC,
    maxTokensPerMonth: 100000,
    maxClients: 3,
    tokensUsed: 0,
    storageUsed: 0,
    storageUsedFormatted: '0 Bytes',
    storageLimit: 50 * 1024 * 1024, // 50MB default
    storageLimitFormatted: '50 MB',
    storageUsagePercentage: 0,
    isLoading: true
  })

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription/usage-info', {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          setSubscription({
            plan: data.plan || 'free',
            tier: getTierFromPlan(data.plan || 'free'),
            maxTokensPerMonth: data.tokensLimit || 0,
            maxClients: data.clientsLimit || 0,
            tokensUsed: data.tokensUsed || 0,
            storageUsed: data.storageUsed || 0,
            storageUsedFormatted: data.storageUsedFormatted || '0 Bytes',
            storageLimit: data.storageLimit || 0,
            storageLimitFormatted: data.storageLimitFormatted || '0 Bytes',
            storageUsagePercentage: data.storageUsagePercentage || 0,
            status: data.status,
            currentPeriodEnd: data.currentPeriodEnd,
            isActive: data.isActive,
            isLoading: false
          })
        } else {
          console.error('Failed to fetch subscription info')
          setSubscription(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setSubscription(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchSubscription()
  }, [])

  return subscription
} 