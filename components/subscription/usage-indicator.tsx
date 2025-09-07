'use client'

import {useUsageInfo} from '@/hooks/subscription/use-usage-info'
import {formatUsageDisplay} from '@/components/subscription/usage-cost-formatting'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {AlertCircle, DollarSign} from 'lucide-react'
import {cn} from '@/lib/utils/general'
import {Skeleton} from '@/components/ui/skeleton'
import {useTranslations} from '@/lib/translations/context'

export function UsageIndicator() {
  const { usageInfo, isLoading, error } = useUsageInfo()
  const t = useTranslations('subscription.usageIndicator')

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (error || !usageInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400">{t('usageUnavailable')}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{error || t('errorLoadingUsage')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const { subscription, usage } = usageInfo.subscriptionUsage
  const spendingLimit = subscription.custom_spending_limit_usd || subscription.spending_limit_usd
  const usedCost = usage.cost_usd
  const usageDisplay = formatUsageDisplay(usedCost, spendingLimit)

  const isNearLimit = usageDisplay.percentage >= 80
  const isAtLimit = usageDisplay.percentage >= 100

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors",
            isAtLimit && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
            isNearLimit && !isAtLimit && "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
            !isNearLimit && !isAtLimit && "bg-muted/50 border-border"
          )}>
            <DollarSign className={cn(
              "w-4 h-4",
              usageDisplay.color.replace('text-', '')
            )} />
            <div className="flex items-center gap-2">
              <div className="relative h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className={cn("h-full transition-all duration-300 ease-in-out", usageDisplay.bgColor)}
                  style={{ width: `${Math.min(usageDisplay.percentage, 100)}%` }}
                />
              </div>
              <span className={cn("text-xs font-medium", usageDisplay.color)}>
                {usageDisplay.percentage}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">
              {t('tooltipMessage', { percentage: usageDisplay.percentage })}
            </p>
            {isAtLimit && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                {t('limitReached')}
              </p>
            )}
            {isNearLimit && !isAtLimit && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                {t('approachingLimit')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}