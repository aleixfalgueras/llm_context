'use client'

import {Suspense, useState} from 'react'
import {Button} from '@/components/ui/button'
import {SettingsIcon, Trash2} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { handleClientApiError } from '@/lib/api/api-toast'
import { useRouter } from 'next/navigation'
import {isDowngrade as checkIsDowngrade} from '@/lib/subscription/subscription-plan-utils'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import {Navbar} from '@/components/global/navbar'
import {UpgradeDowngradeDialog} from '@/components/subscription/upgrade-downgrade-dialog'
import {SubscriptionUrlHandler} from '@/components/subscription/subscription-url-handler'
import {SubscriptionStatusBanners} from '@/components/subscription/subscription-status-banners'
import {PlanCard} from '@/components/subscription/plan-card'
import {SubscriptionFAQ} from '@/components/subscription/subscription-faq'
import {useSubscriptionStatus} from '@/hooks/subscription/use-subscription-status'
import {useSubscriptionActions} from '@/hooks/subscription/use-subscription-actions'
import {useSubscriptionRefresh} from '@/hooks/subscription/use-subscription-refresh'
import {useToast} from '@/hooks/use-toast'
import {SubscriptionPlan} from "@prisma/client";

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

  const handlePlanActionWrapper = (planId: string) => {
    handlePlanAction(planId, isPendingDowngrade(), isPendingPlanChange(planId))
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete account' }))
        throw new Error(errorData.error)
      }

      const result = await response.json()
      
      // Show success message and redirect to home page
      alert(`Account deleted successfully. Deletion ID: ${result.deletionId}`)
      
      // Clear form and close dialog
      setShowDeleteConfirm(false)
      setConfirmationText('')
      
      // Redirect to home page since user is now deleted
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'
      handleClientApiError(errorMessage, 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to get dynamic button text based on subscription status
  const getManageButtonText = () => {
    // For free mode users, always show "Manage Subscription"
    if (isFreeMode()) {
      return 'Manage Subscription'
    }

    // For active subscriptions
    if (subscription.isActive) {
      // If marked for cancellation, show reactivate option
      if (subscription.cancelAtPeriodEnd) {
        return 'Reactivate Subscription'
      }
      // If active and not marked for cancellation, show cancel option
      return 'Cancel Subscription'
    }

    // For all other cases (expired, inactive, etc.)
    return 'Manage Subscription'
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
        <h1 className="text-4xl font-bold text-center">Choose Your Plan</h1>

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
                Delete Account
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
                      {subscription.isActive ? 'Active Subscription' : 'Expired Subscription'} -
                      {subscription.isActive ? ' Renews' : ' Expired'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB')}
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
                {portalLoading ? 'Loading...' : getManageButtonText()}
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
              isCurrentPlan={isCurrentPlan(planId)}
              isFreeMode={isFreeMode()}
              isPendingDowngrade={isPendingDowngrade()}
              isPendingPlanChange={isPendingPlanChange(planId)}
              upgradeLoading={upgradeLoading}
              cancelDowngradeLoading={cancelDowngradeLoading}
              isActiveCancelled={isActiveCancelled()}
              isExpired={isExpired()}
              isPastDueOrUnpaid={isPastDueOrUnpaid()}
              onPlanAction={handlePlanActionWrapper}
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
      />

      {/* Account Deletion Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                ⚠️ This action cannot be undone
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmationText">
                Type "DELETE MY ACCOUNT" to confirm:
              </Label>
              <Input
                id="confirmationText"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deletionReason">
                Reason for deletion (optional):
              </Label>
              <select
                id="deletionReason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="user_request">I no longer need the service</option>
                <option value="privacy_concerns">Privacy concerns</option>
                <option value="service_issues">Service issues</option>
                <option value="other">Other</option>
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
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleAccountDeletion}
                disabled={confirmationText !== 'DELETE MY ACCOUNT' || isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}