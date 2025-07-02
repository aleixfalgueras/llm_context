'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UsageInfo {
  clientsUsed: number
  clientsLimit: number
  promptsUsed: number
  promptsLimit: number
  storageUsed: number
  storageLimit: number
  plan: string
  tier: string
}

interface UseUsageLimitsReturn {
  // State
  usageInfo: UsageInfo | null
  loading: boolean
  
  // Actions
  checkClientLimit: () => Promise<boolean>
  checkPromptLimit: () => Promise<boolean>
  checkStorageLimit: () => Promise<boolean>
  refreshUsageInfo: () => Promise<void>
  getUsageInfo: () => Promise<UsageInfo | null>
}

export function useUsageLimits(): UseUsageLimitsReturn {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getUsageInfo = useCallback(async (): Promise<UsageInfo | null> => {
    try {
      const response = await fetch('/api/subscription/usage-info')
      if (response.ok) {
        const data = await response.json()
        setUsageInfo(data)
        return data
      }
      return null
    } catch (error) {
      console.error('Error fetching usage info:', error)
      return null
    }
  }, [])

  const refreshUsageInfo = useCallback(async () => {
    setLoading(true)
    try {
      await getUsageInfo()
    } finally {
      setLoading(false)
    }
  }, [getUsageInfo])

  const checkClientLimit = useCallback(async (): Promise<boolean> => {
    try {
      const usage = await getUsageInfo()
      if (!usage) return true // Allow if we can't check

      if (usage.clientsUsed >= usage.clientsLimit) {
        toast({
          title: 'Client Limit Reached',
          description: `You've reached your client limit (${usage.clientsLimit}). Please upgrade your plan or delete some existing clients to create new ones.`,
          variant: 'destructive',
          duration: 8000,
        })
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking client limit:', error)
      return true // Allow if check fails
    }
  }, [getUsageInfo, toast])

  const checkPromptLimit = useCallback(async (): Promise<boolean> => {
    try {
      const usage = await getUsageInfo()
      if (!usage) return true // Allow if we can't check

      if (usage.promptsUsed >= usage.promptsLimit) {
        toast({
          title: 'Prompt Limit Reached',
          description: `You've reached your prompt limit (${usage.promptsLimit}). Please upgrade your plan or delete some existing prompts to create new ones.`,
          variant: 'destructive',
          duration: 8000,
        })
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking prompt limit:', error)
      return true // Allow if check fails
    }
  }, [getUsageInfo, toast])

  const checkStorageLimit = useCallback(async (): Promise<boolean> => {
    try {
      const usage = await getUsageInfo()
      if (!usage) return true // Allow if we can't check

      if (usage.storageUsed >= usage.storageLimit) {
        toast({
          title: 'Storage Limit Reached',
          description: `You've reached your storage limit (${usage.storageLimit} MB). Please upgrade your plan or delete some documents to free up space.`,
          variant: 'destructive',
          duration: 8000,
        })
        return false
      }
      return true
    } catch (error) {
      console.error('Error checking storage limit:', error)
      return true // Allow if check fails
    }
  }, [getUsageInfo, toast])

  return {
    // State
    usageInfo,
    loading,
    
    // Actions
    checkClientLimit,
    checkPromptLimit,
    checkStorageLimit,
    refreshUsageInfo,
    getUsageInfo,
  }
}