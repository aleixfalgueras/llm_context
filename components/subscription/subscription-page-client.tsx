'use client'

import {Suspense, useState, useEffect, useRef} from 'react'
import {Button} from '@/components/ui/button'
import {SettingsIcon, Trash2} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { handleClientApiError } from '@/lib/api/api-toast'
import { useRouter } from 'next/navigation'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import {Navbar} from '@/components/global/navbar'
import {BillingInterval} from '@prisma/client'
import {UpgradeDowngradeDialog} from '@/components/subscription/upgrade-downgrade-dialog'
import {SubscriptionUrlHandler} from '@/components/subscription/subscription-url-handler'
import {SubscriptionStatusBanners} from '@/components/subscription/subscription-status-banners'
import {PlanCard} from '@/components/subscription/plan-card'
import {SubscriptionFAQ} from '@/components/subscription/subscription-faq'
import {useTranslations} from '@/lib/translations/context'
import {useSubscriptionStatus} from '@/hooks/subscription/use-subscription-status'
import {useSubscriptionActions} from '@/hooks/subscription/use-subscription-actions'
import {useSubscriptionRefresh} from '@/hooks/subscription/use-subscription-refresh'
import {useToast} from '@/hooks/use-toast'
import {SubscriptionPlan} from "@prisma/client";
import {DELETE_CONFIRMATION_TEXT} from '@/lib/types/account-types'

import {isDowngrade as checkIsDowngrade} from "@/lib/utils/subscription-client-utils";
import {ResolvedPlanTexts} from "@/lib/utils/subscription-features";

interface SubscriptionPageClientProps {
  resolvedFeatures: Record<string, ResolvedPlanTexts>
}

export function SubscriptionPageClient({ resolvedFeatures }: SubscriptionPageClientProps) {
  const t = useTranslations()
  const tSub = useTranslations('subscription')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.monthly)
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
    isCurrentPlan,
    isPastDueOrUnpaid,
    isExpired
  } = useSubscriptionStatus()

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [deletionReason, setDeletionReason] = useState('user_request')
  const router = useRouter()

  const { isRefreshing, setIsRefreshing, refreshSubscriptionWithFallback } = useSubscriptionRefresh({ refetch: subscription.refetch })

  const {
    upgradeLoading,
    cancelDowngradeLoading,
    portalLoading,
    retryPaymentLoading,
    confirmationDialog,
    handlePlanAction,
    handleConfirmUpgrade,
    handleCloseConfirmation,
    handleManageSubscription,
    handleRetryPayment
  } = useSubscriptionActions({ refreshSubscriptionWithFallback })

  const { toast } = useToast()
  const hasSetInitialInterval = useRef(false)

  // Automatically set billing interval based on user's subscription (only once on load)
  useEffect(() => {
    // Only set if we haven't set it before and user has a real subscription
    if (!hasSetInitialInterval.current && subscription.billingInterval && !isFreeMode()) {
      setBillingInterval(subscription.billingInterval)
      hasSetInitialInterval.current = true
    }
  }, [subscription.billingInterval, isFreeMode])

  const handlePlanActionWrapper = (planId: string) => {
    handlePlanAction(planId, isPendingDowngrade(), isPendingPlanChange(planId), billingInterval)
  }

  // Delete account handler
  const handleAccountDeletion = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText,
          reason: deletionReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.api.deleteAccount') }))
        throw new Error(errorData.error)
      }

      const result = await response.json()

      // Show success message and redirect to home page
      alert(tSub('deleteAccount.successMessage').replace('{deletionId}', result.deletionId))

      // Clear form and close dialog
      setShowDeleteConfirm(false)
      setConfirmationText('')

      // Redirect to home page since user is now deleted
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      const errorMessage = error instanceof Error ? error.message : t('errors.api.deleteAccount')
      handleClientApiError(errorMessage, t('errors.api.deleteAccount'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to get dynamic button text based on subscription status
  const getManageButtonText = () => {
    // For free mode users, always show "Manage Subscription"
    if (isFreeMode()) {
      return tSub('manageButtons.manage')
    }

    // For active subscriptions
    if (subscription.isActive) {
      // If marked for cancellation, show reactivate option
      if (subscription.cancelAtPeriodEnd) {
        return tSub('manageButtons.reactivate')
      }
      // If active and not marked for cancellation, show cancel option
      return tSub('manageButtons.cancel')
    }

    // For all other cases (expired, inactive, etc.)
    return tSub('manageButtons.manage')
  }

  return (
    <div className="min-h-screen bg-background">
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
        <h1 className="text-4xl font-bold text-center">{tSub('pageTitle')}</h1>

        {/* Billing Interval Toggle */}
        <div className="flex flex-col items-center mt-6 mb-4">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setBillingInterval(BillingInterval.monthly)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingInterval === BillingInterval.monthly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tSub('billing.monthly')}
            </button>
            <button
              onClick={() => setBillingInterval(BillingInterval.annual)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingInterval === BillingInterval.annual
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tSub('billing.annual')}
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">-20%</span>
            </button>
          </div>

          {/* Show banner when billing interval differs from current subscription */}
          {subscription.billingInterval &&
           subscription.billingInterval !== billingInterval &&
           subscription.stripeSubscriptionId &&
           !isFreeMode() && (
            <div className="mt-3 max-w-2xl mx-auto">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  {tSub('billing.intervalChangeBanner')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Layout: Delete Account Button | Status Banners | Manage Subscription Button */}
        <div className="text-center mb-8 ml-10">
          <div className="flex justify-center items-center gap-6">
            {/* Delete Account Button - Left */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="inline-flex items-center gap-2"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {tSub('deleteAccount.buttonLabel')}
              </Button>
            </div>

            {/* Status Banners - Center */}
            <div className="flex-shrink-0">
              <SubscriptionStatusBanners
                isFreeMode={isFreeMode()}
                isActiveCancelled={isActiveCancelled()}
                isPendingDowngrade={isPendingDowngrade()}
                isPastDueOrUnpaid={isPastDueOrUnpaid()}
                currentPeriodEnd={new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB') || null}
                getRemainingTrialDays={getRemainingTrialDays}
                getRemainingActiveDays={getRemainingActiveDays}
                getRemainingDowngradeDays={getRemainingDowngradeDays}
                capitalizePlanName={capitalizePlanName}
                pendingPlanChange={subscription.pendingPlanChange ?? ""}
                onRetryPayment={handleRetryPayment}
                retryPaymentLoading={retryPaymentLoading}
              />

              {/* Show subscription status info when there are no status banners */}
              {!isFreeMode() && !isActiveCancelled() && !isPendingDowngrade() && !isPastDueOrUnpaid() && subscription.currentPeriodEnd && (
                <div className="mt-2 text-center">
                  <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg ${
                    subscription.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    <span className="text-[18px]">
                      {subscription.isActive ? tSub('status.active') : tSub('status.expired')} -
                      {subscription.isActive ? ` ${tSub('status.renews')}` : ` ${tSub('status.expiresOn')}`} on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Subscription Button - Right */}
            <div className="flex-shrink-0">
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                {portalLoading ? tSub('manageButtons.loading') : getManageButtonText()}
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => (
            <PlanCard
              key={planId}
              planId={planId}
              plan={plan}
              currentPlan={subscription.plan as SubscriptionPlan}
              currentBillingInterval={subscription.billingInterval}
              isCurrentPlan={isCurrentPlan(planId, billingInterval)}
              isFreeMode={isFreeMode()}
              isPendingDowngrade={isPendingDowngrade()}
              isPendingPlanChange={isPendingPlanChange(planId)}
              upgradeLoading={upgradeLoading}
              cancelDowngradeLoading={cancelDowngradeLoading}
              isActiveCancelled={isActiveCancelled()}
              isExpired={isExpired()}
              isPastDueOrUnpaid={isPastDueOrUnpaid()}
              onPlanAction={handlePlanActionWrapper}
              billingInterval={billingInterval}
              resolvedFeatures={resolvedFeatures[planId].features}
              resolvedDescription={resolvedFeatures[planId].description}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <SubscriptionFAQ />
      </div>

      {/* Upgrade Confirmation Dialog */}
      <UpgradeDowngradeDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmUpgrade}
        targetPlan={confirmationDialog.targetPlan || SubscriptionPlan.apprentice}
        isLoading={upgradeLoading !== null}
        hasActiveSubscription={!!subscription.stripeSubscriptionId && subscription.isActive && !isExpired()}
        isDowngrade={confirmationDialog.targetPlan ? checkIsDowngrade(subscription.plan as SubscriptionPlan, confirmationDialog.targetPlan) : false}
        billingInterval={billingInterval}
      />

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle >{tSub('deleteAccount.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg">
              <p className="text-sm font-medium mb-2">
                {tSub('deleteAccount.warningMessage')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationText">
                {t('ui.deleteAccount.confirmInstruction')}
              </Label>
              <Input
                id="confirmationText"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={t('ui.deleteAccount.confirmationText')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deletionReason">
                {tSub('deleteAccount.reasonLabel')}
              </Label>
              <select
                id="deletionReason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="user_request">{tSub('deleteAccount.reasons.noLongerNeed')}</option>
                <option value="privacy_concerns">{tSub('deleteAccount.reasons.privacyConcerns')}</option>
                <option value="service_issues">{tSub('deleteAccount.reasons.serviceIssues')}</option>
                <option value="other">{tSub('deleteAccount.reasons.other')}</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmationText('')
                }}
                className="flex-1"
                disabled={isDeleting}
              >
                {tSub('deleteAccount.cancelButton')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleAccountDeletion}
                disabled={confirmationText !== DELETE_CONFIRMATION_TEXT || isDeleting}
                className="flex-1"
              >
                {isDeleting ? tSub('deleteAccount.deleting') : tSub('deleteAccount.deleteButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
