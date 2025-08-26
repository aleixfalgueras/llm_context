'use client'

import {useEffect, useState} from 'react'
import {SubscriptionWithValidation} from '@/lib/types/subscription-types'
import {SubscriptionPlan, SubscriptionStatus} from '@prisma/client'

// Default values for initial state to prevent null pointer errors during prerendering
const defaultSubscriptionWithValidation: SubscriptionWithValidation = {
  id: '',
  userId: '',
  email: null,
  plan: SubscriptionPlan.apprentice,
  status: SubscriptionStatus.active,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  createdAt: new Date(),
  updatedAt: new Date(),
  canceledAt: new Date(),
  cancelAtPeriodEnd: false,
  pendingPlanChange: null,
  stripeScheduleId: null,
  spending_limit_usd: 5.00,
  custom_spending_limit_usd: null,
  isActive: true
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionWithValidation>(defaultSubscriptionWithValidation)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscription = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      
      const url = forceRefresh 
        ? `/api/subscription?t=${Date.now()}`
        : '/api/subscription'
      
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
        
        setSubscription(data)
        setIsLoading(false)
        return true
      } else {
        console.error('Failed to fetch subscription info')
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setIsLoading(false)
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
    void fetchSubscription()
  }, [])

  return {
    ...subscription,
    isLoading,
    refetch
  }
}