'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'

interface SubscriptionStatusBannersProps {
  isFreeMode: boolean
  isActiveCancelled: boolean
  isPendingDowngrade: boolean
  isPastDueOrUnpaid: boolean
  currentPeriodEnd?: string | null
  getRemainingTrialDays: () => number
  getRemainingActiveDays: () => number
  getRemainingDowngradeDays: () => number
  capitalizePlanName: (planName: string | undefined) => string
  pendingPlanChange?: string
  onRetryPayment?: () => void
  retryPaymentLoading?: boolean
}

export function SubscriptionStatusBanners({
  isFreeMode,
  isActiveCancelled,
  isPendingDowngrade,
  isPastDueOrUnpaid,
  getRemainingActiveDays,
  getRemainingDowngradeDays,
  capitalizePlanName,
  pendingPlanChange,
  currentPeriodEnd,
  onRetryPayment,
  retryPaymentLoading
}: SubscriptionStatusBannersProps) {
  const t = useTranslations('subscription')
  return (
    <>
      {/* Free Apprentice Plan Banner */}
      {isFreeMode && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700">
            <span className="text-[18px]">
              {t('statusBanners.freePlan.active')}
            </span>
          </div>
        </div>
      )}
      
      {/* Active Subscription Marked for Cancellation */}
      {isActiveCancelled && currentPeriodEnd && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
            <span className="text-[18px]">
              {t('statusBanners.activeCancelled.status', { days: getRemainingActiveDays() })}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('statusBanners.activeCancelled.willBeCancelled', { date: currentPeriodEnd })}
          </p>
        </div>
      )}
      
      {/* Active Subscription Marked for Downgrade */}
      {isPendingDowngrade && currentPeriodEnd && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
            <span className="text-[18px]">
              {t('statusBanners.pendingDowngrade.status', { days: getRemainingDowngradeDays(), plan: capitalizePlanName(pendingPlanChange) })}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('statusBanners.pendingDowngrade.willBeDowngraded', { date: currentPeriodEnd })}
          </p>
        </div>
      )}
      
      {/* Past Due/Unpaid Subscription Banner */}
      {isPastDueOrUnpaid && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700">
            <span className="text-[18px]">
              {t('statusBanners.paymentRequired.status')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
            {t('statusBanners.paymentRequired.message')}
          </p>
          {onRetryPayment && (
            <Button
              onClick={onRetryPayment}
              disabled={retryPaymentLoading}
              variant="blue"
              className="px-6 py-2"
            >
              {retryPaymentLoading ? t('statusBanners.paymentRequired.processingPayment') : t('statusBanners.paymentRequired.retryButton')}
            </Button>
          )}
        </div>
      )}
    </>
  )
}