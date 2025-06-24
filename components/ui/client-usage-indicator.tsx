'use client'

import { Badge } from '@/components/ui/badge'

import { Users, Infinity } from 'lucide-react'
import Link from 'next/link'

interface UsageInfo {
  clients: {
    allowed: boolean
    limit: number | 'unlimited'
    used: number
    remaining?: number
  }
}

interface ClientUsageIndicatorProps {
  className?: string
  usageInfo?: UsageInfo | null
}

export function ClientUsageIndicator({ className, usageInfo }: ClientUsageIndicatorProps) {
  if (!usageInfo) {
    return (
      <Link href="/pricing" className="group">
        <div className={`inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer ${className}`}>
          <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
        </div>
      </Link>
    )
  }

  if (!usageInfo?.clients) {
    return null
  }

  const { clients } = usageInfo
  const isUnlimited = clients.limit === 'unlimited'
  const isNearLimit = !isUnlimited && typeof clients.limit === 'number' && clients.limit > 0 && clients.used / clients.limit >= 0.8
  const isAtLimit = !clients.allowed





  return (
    <Link href="/pricing" className="group">
      <div className={`inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer ${className}`}>
        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
        <span className="font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Clients:</span>
        <Badge variant="default" className="text-xs">
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              <Infinity className="w-3 h-3" />
              Unlimited
            </span>
          ) : (
            `${clients.used} / ${clients.limit}`
          )}
        </Badge>
      </div>
    </Link>
  )
} 