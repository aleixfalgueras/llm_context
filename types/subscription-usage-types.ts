import {UserUsage} from "@prisma/client";
import {SubscriptionWithValidation} from "@/types/subscription-types";

export interface SubscriptionUsage {
  subscription: SubscriptionWithValidation
  usage: UserUsage
}

export interface StorageUsage {
  totalBytes: number
  documentCount: number
  usageByClient: Record<string, number>
}

export interface StorageSubscriptionUsage {
  usage: StorageUsage
  limit: number
  limitFormatted: string
  usedFormatted: string
  usagePercentage: number
  remainingFormatted: string
}

export interface UsageInfo {
  subscriptionUsage: SubscriptionUsage
  storageSubscriptionUsage: StorageSubscriptionUsage
}
