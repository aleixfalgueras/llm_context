'use client'

import {Suspense} from 'react'
import {Button} from '@/components/ui/button'
import {SettingsIcon} from 'lucide-react'
import {isDowngrade as checkIsDowngrade} from '@/lib/subscription/subscription-plan-utils'
import {SUBSCRIPTION_PLAN_DETAIL, SubscriptionPlan} from '@/types/subscription-types'
import {Navbar} from '@/components/global/navbar'
import {UpgradeConfirmationDialog} from '@/components/subscription/upgrade-confirmation-dialog'
import {SubscriptionUrlHandler} from '@/components/subscription/subscription-url-handler'
import {SubscriptionStatusBanners} from '@/components/subscription/subscription-status-banners'
import {PlanCard} from '@/components/subscription/plan-card'
import {SubscriptionFAQ} from '@/components/subscription/subscription-faq'
import {useSubscriptionStatus} from '@/hooks/use-subscription-status'
import {useSubscriptionActions} from '@/hooks/use-subscription-actions'
import {useSubscriptionRefresh} from '@/hooks/use-subscription-refresh'
import {useToast} from '@/hooks/use-toast'

export default function SubscriptionPage() {
  const {
    subscription,
    isFreeMode,
    getRemainingTrialDays,
    isActiveCancelled,
    getRemainingActiveDays,
    isPendingDowngrade,
    isPendingPlanChange,
    getRemainingDowngradeDays,
    capitalizePlanName,
    isCurrentPlan
  } = useSubscriptionStatus()

  const { isRefreshing, setIsRefreshing, refreshSubscriptionWithFallback } = useSubscriptionRefresh()

  const {
    upgradeLoading,
    cancelDowngradeLoading,
    portalLoading,
    confirmationDialog,
    handlePlanAction,
    handleConfirmUpgrade,
    handleCloseConfirmation,
    handleManageSubscription
  } = useSubscriptionActions({ refreshSubscriptionWithFallback })

  const { toast } = useToast()

  const handlePlanActionWrapper = (planId: string) => {
    handlePlanAction(planId, isPendingDowngrade(), isPendingPlanChange(planId))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Suspense fallback={null}>
        <SubscriptionUrlHandler 
          subscription={subscription} 
          toast={toast} 
          setIsRefreshing={setIsRefreshing} 
        />
      </Suspense>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16 relative">
          {/* Manage Subscription Section - Top Right */}
          <div className="absolute top-0 right-0">
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                {portalLoading ? 'Loading...' : 'Manage Subscription'}
              </Button>
              
              {/* Updating Status Message */}
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>

          {/* Status Banners */}
          <SubscriptionStatusBanners
            isFreeMode={isFreeMode()}
            isActiveCancelled={isActiveCancelled()}
            isPendingDowngrade={isPendingDowngrade()}
            currentPeriodEnd={subscription.currentPeriodEnd || null}
            getRemainingTrialDays={getRemainingTrialDays}
            getRemainingActiveDays={getRemainingActiveDays}
            getRemainingDowngradeDays={getRemainingDowngradeDays}
            capitalizePlanName={capitalizePlanName}
            pendingPlanChange={subscription.pendingPlanChange}
          />
          
          {/* Current Subscription Status - Only show for paid subscriptions that are not marked for cancellation or downgrade */}
          {!isFreeMode() && !isActiveCancelled() && !isPendingDowngrade() && subscription.currentPeriodEnd && (
            <div className="mt-8 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                subscription.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <span className="font-medium">
                  {subscription.isActive ? 'Active Subscription' : 'Expired Subscription'} - 
                  {subscription.isActive ? ' Renews' : ' Expired'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => (
            <PlanCard
              key={planId}
              planId={planId}
              plan={plan}
              currentPlan={subscription.plan as SubscriptionPlan}
              isCurrentPlan={isCurrentPlan(planId)}
              isFreeMode={isFreeMode()}
              isPendingDowngrade={isPendingDowngrade()}
              isPendingPlanChange={isPendingPlanChange(planId)}
              upgradeLoading={upgradeLoading}
              cancelDowngradeLoading={cancelDowngradeLoading}
              onPlanAction={handlePlanActionWrapper}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <SubscriptionFAQ />
      </div>

      {/* Upgrade Confirmation Dialog */}
      <UpgradeConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmUpgrade}
        targetPlan={confirmationDialog.targetPlan || SubscriptionPlan.BASIC}
        isLoading={upgradeLoading !== null}
        hasActiveSubscription={!!subscription.stripeSubscriptionId}
        isDowngrade={confirmationDialog.targetPlan ? checkIsDowngrade(subscription.plan as SubscriptionPlan, confirmationDialog.targetPlan) : false}
      />
    </div>
  )
}