import { SubscriptionPlan } from '@/types/subscription-types'

// Plan hierarchy for upgrade/downgrade detection
export const PLAN_HIERARCHY = [SubscriptionPlan.BASIC, SubscriptionPlan.PRO, SubscriptionPlan.BUSINESS]

// Plan name color utilities
export function getPlanNameColor(planId: string) {
  switch (planId) {
    case SubscriptionPlan.BASIC: return 'text-green-600 dark:text-green-400'
    case SubscriptionPlan.PRO: return 'text-blue-600 dark:text-blue-400'
    case SubscriptionPlan.BUSINESS: return 'text-purple-600 dark:text-purple-400'
    default: return 'text-green-600 dark:text-green-400'
  }
}

/**
 * Determine if a plan change is a downgrade
 */
export function isDowngrade(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan)
  const targetIndex = PLAN_HIERARCHY.indexOf(targetPlan)
  return targetIndex < currentIndex
}