import {SUBSCRIPTION_PLAN_HIERARCHY, SUBSCRIPTION_PLAN_NAMES} from '@/lib/types/subscription-types'
import {SubscriptionPlan} from '@prisma/client'

// Plan name color utilities
export function getPlanNameColor(planId: string) {
  switch (planId) {
    case SubscriptionPlan.apprentice: return 'text-green-600 dark:text-green-400'
    case SubscriptionPlan.knight: return 'text-blue-600 dark:text-blue-400'
    case SubscriptionPlan.master: return 'text-purple-600 dark:text-purple-400'
    case SubscriptionPlan.jedi: return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-green-600 dark:text-green-400'
  }
}

// Get plan icon component name based on plan ID
export function getPlanIconType(planId: string) {
  switch (planId) {
    case SubscriptionPlan.apprentice: return 'ZapIcon'
    case SubscriptionPlan.knight: return 'ShieldIcon'
    case SubscriptionPlan.master: return 'StarIcon'
    case SubscriptionPlan.jedi: return 'CrownIcon'
    default: return 'ZapIcon'
  }
}

// Get button styles based on plan state
export function getButtonStyles(isCurrentPlan: boolean, isPendingDowngrade: boolean, isPendingPlanChange: boolean) {
  if (isCurrentPlan) {
    return 'bg-gray-500 hover:bg-gray-600 text-gray-900'
  }
  if (isPendingDowngrade && isPendingPlanChange) {
    return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
  }
  if (isPendingDowngrade && !isPendingPlanChange) {
    return 'bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed'
  }
  return 'bg-blue-600 hover:bg-blue-700 text-white'
}

/**
 * Determine if a plan change is a downgrade
 */
export function isDowngrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentIndex = SUBSCRIPTION_PLAN_HIERARCHY.indexOf(currentPlan)
  const targetIndex = SUBSCRIPTION_PLAN_HIERARCHY.indexOf(targetPlan)
  return targetIndex < currentIndex
}

// Get button text based on plan state
export function getButtonText(
  planId: string, 
  currentPlan: SubscriptionPlan,
  isFreeMode: boolean,
  isPendingDowngrade: boolean, 
  isPendingPlanChange: boolean,
  isCurrentPlan: boolean,
  isExpired?: boolean,
  t?: (key: string, params?: any) => string
) {
  // If translations are not available, fall back to English
  if (!t) {
    // Free mode users and expired subscription users see "Subscribe to..." for all plans
    if (isFreeMode || isExpired) {
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
    
    // Check if this is a downgrade
    if (isDowngrade(currentPlan, planId as SubscriptionPlan)) {
      return `Downgrade to ${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]}`
    }
    
    // For upgrades
    return `Upgrade to ${SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]}`
  }

  // Use translations when available
  const planName = SUBSCRIPTION_PLAN_NAMES[planId as keyof typeof SUBSCRIPTION_PLAN_NAMES]
  
  // Free mode users and expired subscription users see "Subscribe to..." for all plans
  if (isFreeMode || isExpired) {
    return t('planCard.subscribeTo', { planName })
  }
  
  // Check if this plan is the target of a pending downgrade
  if (isPendingDowngrade && isPendingPlanChange) {
    return t('planCard.cancelDowngrade')
  }
  
  // Check if this is the current plan (for paid users)
  if (isCurrentPlan) {
    return t('planCard.currentPlan')
  }
  
  // Check if this is a downgrade
  if (isDowngrade(currentPlan, planId as SubscriptionPlan)) {
    return t('planCard.downgradeTo', { planName })
  }
  
  // For upgrades
  return t('planCard.upgradeTo', { planName })
}

