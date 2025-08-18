import {SubscriptionPlan} from "@prisma/client";
import {SubscriptionPlanType} from "@/lib/types/subscription-types";

export const STORAGE_LIMITS = {
  [SubscriptionPlan.apprentice]: 100 * 1024 * 1024,    // 100 MB for apprentice plan
  [SubscriptionPlan.knight]: 500 * 1024 * 1024,        // 500 MB for knight plan
  [SubscriptionPlan.master]: 2 * 1024 * 1024 * 1024,   // 2 GB for master plan
  [SubscriptionPlan.jedi]: 10 * 1024 * 1024 * 1024,    // 10 GB for jedi plan
} as const

export function getStorageLimitForPlan(plan: SubscriptionPlanType): number {
  switch (plan) {
    case SubscriptionPlan.apprentice:
      return STORAGE_LIMITS[SubscriptionPlan.apprentice]
    case SubscriptionPlan.knight:
      return STORAGE_LIMITS[SubscriptionPlan.knight]
    case SubscriptionPlan.master:
      return STORAGE_LIMITS[SubscriptionPlan.master]
    case SubscriptionPlan.jedi:
      return STORAGE_LIMITS[SubscriptionPlan.jedi]
    default:
      return STORAGE_LIMITS[SubscriptionPlan.apprentice] // Default to apprentice plan limits
  }
}

export interface StorageUsage {
  totalBytes: number
  documentCount: number
  usageByClient: Record<string, number>
}