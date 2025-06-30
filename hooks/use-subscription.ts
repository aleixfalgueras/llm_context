'use client'

import { useState, useEffect } from 'react'
import { getTierFromPlan } from '@/lib/models-config'

interface SubscriptionInfo {
  plan: string
  tier: 'basic' | 'pro'
  maxTokensPerMonth: number
  maxClients: number
  tokensUsed: number
  documentsGenerated: number
  isLoading: boolean
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: 'basic',
    tier: 'basic',
    maxTokensPerMonth: 100000,
    maxClients: 3,
    tokensUsed: 0,
    documentsGenerated: 0,
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
            plan: data.subscription.plan,
            tier: getTierFromPlan(data.subscription.plan),
            maxTokensPerMonth: data.subscription.maxTokensPerMonth,
            maxClients: data.subscription.maxClients,
            tokensUsed: data.usage.tokensUsed,
            documentsGenerated: data.usage.documentsGenerated,
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