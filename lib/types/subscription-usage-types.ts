import {UserUsage} from "@prisma/client";
import {SubscriptionWithValidation} from "@/lib/types/subscription-types";
import {StorageUsage} from "@/lib/types/storage-types";

export interface SubscriptionUsage {
  subscription: SubscriptionWithValidation
  usage: UserUsage
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
