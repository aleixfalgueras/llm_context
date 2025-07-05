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
          
          // API now returns { subscription: {...}, clients: {...}, tokens: {...}, storage: {...} }
          const subscription = data.subscription || {}
          const tokens = data.tokens || {}
          const storage = data.storage || {}
          
          setSubscription({
            plan: subscription.plan || 'free',
            tier: getTierFromPlan(subscription.plan || 'free'),
            maxTokensPerMonth: subscription.maxTokensPerMonth || 0,
            maxClients: subscription.maxClients || 0,
            tokensUsed: tokens.used || 0,
            storageUsed: storage.used || 0,
            storageUsedFormatted: storage.usedFormatted || '0 Bytes',
            storageLimit: storage.limit || 0,
            storageLimitFormatted: storage.limitFormatted || '0 Bytes',
            storageUsagePercentage: storage.usagePercentage || 0,
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