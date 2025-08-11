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
  currentPeriodEnd,
  getRemainingTrialDays,
  getRemainingActiveDays,
  getRemainingDowngradeDays,
  capitalizePlanName,
  pendingPlanChange,
  onRetryPayment,
  retryPaymentLoading
}: SubscriptionStatusBannersProps) {
  return (
    <>
      {/* Free Trial Banner */}
      {isFreeMode && currentPeriodEnd && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
            <span className="font-semibold text-lg">
              Free Trial Active (Basic Plan) - {getRemainingTrialDays()} days remaining
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Trial expires on {currentPeriodEnd}
          </p>
        </div>
      )}
      
      {/* Active Subscription Marked for Cancellation */}
      {isActiveCancelled && currentPeriodEnd && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
            <span className="font-semibold text-lg">
              Active Subscription (Cancelled) - {getRemainingActiveDays()} days remaining
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Your subscription will be cancelled on {currentPeriodEnd}
          </p>
        </div>
      )}
      
      {/* Active Subscription Marked for Downgrade */}
      {isPendingDowngrade && currentPeriodEnd && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-700">
            <span className="font-semibold text-lg">
              Active Subscription (Downgrading) - {getRemainingDowngradeDays()} days until downgrade to {capitalizePlanName(pendingPlanChange)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Your subscription will be downgraded on {currentPeriodEnd}
          </p>
        </div>
      )}
      
      {/* Past Due/Unpaid Subscription Banner */}
      {isPastDueOrUnpaid && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-700">
            <span className="font-semibold text-lg">
              ⚠️ Payment Required - Subscription Suspended
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
            Your subscription payment failed. Please update your payment method or retry payment to restore access.
          </p>
          {onRetryPayment && (
            <Button
              onClick={onRetryPayment}
              disabled={retryPaymentLoading}
              variant="blue"
              className="font-semibold px-6 py-2"
            >
              {retryPaymentLoading ? 'Processing Payment...' : 'Pay Now to Restore Access'}
            </Button>
          )}
        </div>
      )}
    </>
  )
}