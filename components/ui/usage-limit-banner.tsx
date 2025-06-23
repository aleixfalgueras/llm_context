'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, ArrowUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface UsageInfo {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
}

interface UsageData {
  conversations: UsageInfo
  documents: UsageInfo
  clients: UsageInfo
  prompts: UsageInfo
}

interface UsageLimitBannerProps {
  className?: string
}

export function UsageLimitBanner({ className }: UsageLimitBannerProps) {
  const { user } = useUser()
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUsageData()
    }
  }, [user])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/subscription/usage-info')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (used: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited' || limit === -1) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const shouldShowWarning = (usage: UsageInfo) => {
    if (usage.limit === 'unlimited' || usage.limit === -1) return false
    const percentage = getUsagePercentage(usage.used, usage.limit)
    return percentage >= 80 // Show warning at 80%
  }

  const shouldShowCritical = (usage: UsageInfo) => {
    if (usage.limit === 'unlimited' || usage.limit === -1) return false
    return !usage.allowed // At limit
  }

  const getWarningType = (usage: UsageInfo): 'warning' | 'critical' | null => {
    if (shouldShowCritical(usage)) return 'critical'
    if (shouldShowWarning(usage)) return 'warning'
    return null
  }

  const getAlertContent = (type: 'conversations' | 'documents' | 'clients' | 'prompts', usage: UsageInfo) => {
    const warningType = getWarningType(usage)
    if (!warningType) return null

    const dismissKey = `${type}-${warningType}`
    if (dismissed.has(dismissKey)) return null

    const typeLabels = {
      conversations: 'conversations',
      documents: 'documents', 
      clients: 'clients',
      prompts: 'custom prompts'
    }

    const percentage = getUsagePercentage(usage.used, usage.limit)

    if (warningType === 'critical') {
      return (
        <Alert key={dismissKey} className="border-red-500 bg-red-50 dark:bg-red-900/10 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-red-700 dark:text-red-400">
                You've reached your {typeLabels[type]} limit!
              </span>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                You've used {usage.used} of {usage.limit} {typeLabels[type]} this month. 
                Upgrade to continue using this feature.
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                <Link href="/pricing">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Upgrade
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(prev => new Set(prev).add(dismissKey))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (warningType === 'warning') {
      return (
        <Alert key={dismissKey} className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                You're approaching your {typeLabels[type]} limit
              </span>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                {usage.used} of {usage.limit} used ({percentage.toFixed(0)}%)
              </p>
              <Progress 
                value={percentage} 
                className="mt-2 w-full max-w-xs"
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">View Plans</Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(prev => new Set(prev).add(dismissKey))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  if (loading || !usageData) return null

  const alerts = Object.entries(usageData)
    .map(([type, usage]) => getAlertContent(type as any, usage))
    .filter(Boolean)

  if (alerts.length === 0) return null

  return (
    <div className={className}>
      {alerts}
    </div>
  )
} 