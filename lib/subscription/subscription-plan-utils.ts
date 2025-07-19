import {SUBSCRIPTION_PLAN_NAMES, SubscriptionPlan} from '@/types/subscription-types'

// Plan hierarchy for upgrade/downgrade detection
export const SUBSCRIPTION_PLAN_HIERARCHY = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.BUSINESS]

// Plan name color utilities
export function getPlanNameColor(planId: string) {
  switch (planId) {
    case SubscriptionPlan.BASIC: return 'text-green-600 dark:text-green-400'
    case SubscriptionPlan.PRO: return 'text-blue-600 dark:text-blue-400'
    case SubscriptionPlan.BUSINESS: return 'text-purple-600 dark:text-purple-400'
    default: return 'text-green-600 dark:text-green-400'
  }
}

// Get plan icon component name based on plan ID
export function getPlanIconType(planId: string) {
  switch (planId) {
    case SubscriptionPlan.BASIC: return 'ZapIcon'
    case SubscriptionPlan.PRO: return 'StarIcon'
    case SubscriptionPlan.BUSINESS: return 'CrownIcon'
    default: return 'ZapIcon'
  }
}

// Get button styles based on plan state
export function getButtonStyles(isCurrentPlan: boolean, isPendingDowngrade: boolean, isPendingPlanChange: boolean) {
  if (isCurrentPlan) {
    return 'bg-gray-500 hover:bg-gray-600 text-white'
  }
  if (isPendingDowngrade && isPendingPlanChange) {
    return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
  }
  if (isPendingDowngrade && !isPendingPlanChange) {
    return 'bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed'
  }
  return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
}

// Get button text based on plan state
export function getButtonText(
  planId: string, 
  currentPlan: SubscriptionPlan,
  isFreeMode: boolean,
  isPendingDowngrade: boolean, 
  isPendingPlanChange: boolean,
  isCurrentPlan: boolean
) {
  // Free mode users see "Subscribe to..." for all plans
  if (isFreeMode) {
    return `Subscribe to ${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]}`
  }
  
  // Check if this plan is the target of a pending downgrade
  if (isPendingDowngrade && isPendingPlanChange) {
    return 'Cancel Downgrade'
  }
  
  // Check if this is the current plan (for paid users)
  if (isCurrentPlan) {
    return 'Current Plan'
  }
  
  // If there's a pending downgrade and this is not the target plan, show blocked state
  if (isPendingDowngrade) {
    return `${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]} (Blocked)`
  }
  
  // Check if this is a downgrade
  if (isDowngrade(currentPlan, planId as SubscriptionPlan)) {
    return `Downgrade to ${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]}`
  }
  
  // For upgrades
  return `Upgrade to ${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]}`
}

// Get plan badge visibility for current plan
export function shouldShowPlanBadge(isFreeMode: boolean, isCurrentPlan: boolean) {
  // Free mode users don't get a "Current Plan" badge
  if (isFreeMode) {
    return false
  }
  
  return isCurrentPlan
}

/**
 * Determine if a plan change is a downgrade
 */
export function isDowngrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentIndex = SUBSCRIPTION_PLAN_HIERARCHY.indexOf(currentPlan)
  const targetIndex = SUBSCRIPTION_PLAN_HIERARCHY.indexOf(targetPlan)
  return targetIndex < currentIndex
}