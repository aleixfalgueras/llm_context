'use client'

import { useState, useEffect } from 'react'
import { getTierFromPlan } from '@/lib/ai/models-config'
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
  stripeSubscriptionId?: string
  cancelAtPeriodEnd?: boolean
  pendingPlanChange?: string
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

  const fetchSubscription = async (forceRefresh = false) => {
    try {
      setSubscription(prev => ({ ...prev, isLoading: true }))
      
      const url = forceRefresh 
        ? `/api/subscription/usage-info?t=${Date.now()}`
        : '/api/subscription/usage-info'
      
      if (forceRefresh) {
        console.log('🔄 Forcing subscription refresh with cache bypass:', url)
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const responseData = await response.json()
        
        // Extract the actual data from the API response
        const data = responseData.data || responseData
        
        setSubscription({
          plan: data.plan,
          tier: getTierFromPlan(data.plan),
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
          stripeSubscriptionId: data.stripeSubscriptionId,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          pendingPlanChange: data.pendingPlanChange,
          isLoading: false
        })
        return true
      } else {
        console.error('Failed to fetch subscription info')
        setSubscription(prev => ({ ...prev, isLoading: false }))
        return false
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setSubscription(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }

  const refetch = async (retries: number = 3, delay: number = 1000, forceRefresh = false) => {
    for (let i = 0; i < retries; i++) {
      const success = await fetchSubscription(forceRefresh)
      if (success) return true
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    return false
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  return { ...subscription, refetch }
} 