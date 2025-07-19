interface SubscriptionStatusBannersProps {
  isFreeMode: boolean
  isActiveCancelled: boolean
  isPendingDowngrade: boolean
  currentPeriodEnd?: string | null
  getRemainingTrialDays: () => number
  getRemainingActiveDays: () => number
  getRemainingDowngradeDays: () => number
  capitalizePlanName: (planName: string | undefined) => string
  pendingPlanChange?: string
}

export function SubscriptionStatusBanners({
  isFreeMode,
  isActiveCancelled,
  isPendingDowngrade,
  currentPeriodEnd,
  getRemainingTrialDays,
  getRemainingActiveDays,
  getRemainingDowngradeDays,
  capitalizePlanName,
  pendingPlanChange
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
            Trial expires on {new Date(currentPeriodEnd).toLocaleDateString()}
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
            Your subscription will be cancelled on {new Date(currentPeriodEnd).toLocaleDateString()}
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
            Your subscription will be downgraded on {new Date(currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      )}
    </>
  )
}