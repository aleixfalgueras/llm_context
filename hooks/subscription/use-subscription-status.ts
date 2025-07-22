import {useSubscription} from '@/hooks/subscription/use-subscription'
import {SubscriptionPlan, SubscriptionStatus} from '@prisma/client'

export function useSubscriptionStatus() {
  const subscription = useSubscription()

  // Helper function to calculate remaining days from end date
  const calculateRemainingDays = (endDate: string | Date | null | undefined): number => {
    if (!endDate) return 0
    
    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // Helper function to detect if user is in free mode
  const isFreeMode = () => {
    return subscription.plan === SubscriptionPlan.basic && !subscription.stripeSubscriptionId
  }

  // Helper function to calculate remaining trial days
  const getRemainingTrialDays = () => {
    if (!isFreeMode()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to detect if subscription is active but marked for cancellation
  const isActiveCancelled = () => {
    return !isFreeMode() && !!subscription.isActive && !!subscription.cancelAtPeriodEnd
  }

  // Helper function to calculate remaining days until cancellation
  const getRemainingActiveDays = () => {
    if (!isActiveCancelled()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to detect if subscription has pending downgrade
  const isPendingDowngrade = () => {
    return Boolean(!isFreeMode() && subscription.isActive && subscription.pendingPlanChange && !subscription.cancelAtPeriodEnd)
  }

  // Helper function to safely check if a plan matches the pending change
  const isPendingPlanChange = (planId: string): boolean => {
    return Boolean(subscription.pendingPlanChange && subscription.pendingPlanChange !== "" && subscription.pendingPlanChange === planId)
  }

  // Helper function to calculate remaining days until downgrade
  const getRemainingDowngradeDays = () => {
    if (!isPendingDowngrade()) return 0
    return calculateRemainingDays(subscription.currentPeriodEnd)
  }

  // Helper function to safely capitalize plan name
  const capitalizePlanName = (planName: string | undefined) => {
    if (!planName) return 'Unknown'
    return planName.charAt(0).toUpperCase() + planName.slice(1)
  }

  // Helper function to check if a plan is the current plan
  const isCurrentPlan = (planId: string) => {
    // Free mode users don't have a "current plan" - they're in trial
    if (isFreeMode()) {
      return false
    }
    // Expired subscriptions don't have a "current plan" - they need to resubscribe
    if (isExpired()) {
      return false
    }
    return planId === subscription.plan
  }

  // Helper function to detect if subscription is past due or unpaid
  const isPastDueOrUnpaid = () => {
    // Only for users with actual Stripe subscriptions (not free mode)
    if (isFreeMode()) {
      return false
    }
    return subscription.status === SubscriptionStatus.past_due || subscription.status === SubscriptionStatus.unpaid
  }

  // Helper function to detect if subscription is expired
  const isExpired = () => {
    // User had a subscription but it's no longer active
    return !!subscription.stripeSubscriptionId && subscription.status === SubscriptionStatus.canceled
  }

  return {
    subscription,
    calculateRemainingDays,
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
  }
}