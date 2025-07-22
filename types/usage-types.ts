import {SubscriptionPlan, SubscriptionStatus} from "@prisma/client";

/**
 * Unified usage and limits data structure
 * Combines subscription and usage information for efficient access
 */
export interface UsageLimitsData {
  subscription: {
    plan: SubscriptionPlan
    status: SubscriptionStatus
    currentPeriodEnd: Date
    isActive: boolean
    tokenLimit: number
  }
  usage: {
    tokensUsed: number
    billingPeriodStart: Date
    billingPeriodEnd: Date
  }
}