import {prisma} from '../prisma'
import {logger} from '../logger'
import {SubscriptionService} from '@/services/subscription-service'

// Storage limits per plan (in bytes)
import {SubscriptionPlanType} from '@/lib/types/subscription-types'
import {cacheStorageSubscriptionUsage, getCachedStorageSubscriptionUsage} from "@/lib/subscription/subscription-cache";
import {SubscriptionPlan} from "@prisma/client";
import {StorageSubscriptionUsage, StorageUsage} from "@/lib/types/subscription-usage-types";
import {SubscriptionErrorCode} from "@/services/error-codes";

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

export function calculateDocumentSize(content: string): number {
  // Calculate size in bytes (UTF-8 encoding)
  return new Blob([content]).size
}

/**
 * Format bytes into a human-readable string with appropriate units.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get current storage usage statistics for a user.
 * 
 * Queries the database to calculate total storage usage across all user documents.
 * Aggregates file sizes from the document records and provides breakdown by client.
 * Uses database-stored file sizes for accurate tracking.
 * 
 * @param userId - The user ID to calculate storage usage for
 * @returns Promise<StorageUsage> containing total bytes, document count, and usage by client
 * @throws Error if database query fails
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  try {
    // Get all documents for the user with file sizes from database
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        clientId: true,
        documentPath: true,
        fileSize: true
      }
    })

    let totalBytes = 0
    const usageByClient: Record<string, number> = {}

    // Calculate storage usage from database file sizes
    for (const doc of documents) {
      const fileSize = doc.fileSize || 0
      totalBytes += fileSize
      
      if (!usageByClient[doc.clientId]) {
        usageByClient[doc.clientId] = 0
      }
      usageByClient[doc.clientId] += fileSize
    }

    return {
      totalBytes,
      documentCount: documents.length,
      usageByClient
    }
  } catch (error) {
    logger.error('Error calculating storage usage', error as Error, { userId })
    throw error
  }
}

/**
 * Get comprehensive storage usage for a user with subscription context.
 * 
 * Combines storage usage data with subscription plan limits to provide formatted
 * analytics including usage percentages, remaining space, and formatted values.
 * Implements intelligent caching and parallel data fetching for performance.
 * 
 * @param userId - The user ID to get storage analytics for
 * @param subscription - Optional subscription data, fetched if not provided
 * @returns Promise<StorageSubscriptionUsage> with usage data, limits, and formatted values
 * @throws Error if data fetching or calculation fails
 * 
 * **Performance Features:**
 * - Redis caching with automatic cache population
 * - Parallel fetching of subscription and usage data
 * - Optimized for frequent usage validation calls
 */
export async function getStorageSubscriptionUsage(userId: string, subscription?: any): Promise<StorageSubscriptionUsage> {
  try {
    // Check cache first
    const cached = await getCachedStorageSubscriptionUsage(userId)
    if (cached) {
      return cached
    }

    // If subscription is provided, use it; otherwise fetch it
    const [userSubscription, storageUsage] = await Promise.all([
      subscription ? Promise.resolve(subscription) : SubscriptionService.getUserSubscription(userId),
      getStorageUsage(userId)
    ])

    const storageLimit = getStorageLimitForPlan(userSubscription.plan)

    const storageSubscriptionUsage = {
      usage: storageUsage,
      limit: storageLimit,
      limitFormatted: formatBytes(storageLimit),
      usedFormatted: formatBytes(storageUsage.totalBytes),
      usagePercentage: Math.round((storageUsage.totalBytes / storageLimit) * 100),
      remainingFormatted: formatBytes(Math.max(0, storageLimit - storageUsage.totalBytes))
    }

    // Cache the result
    await cacheStorageSubscriptionUsage(userId, storageSubscriptionUsage)

    return storageSubscriptionUsage
  } catch (error) {
    logger.error('Error getting storage analytics', error as Error, { userId })
    throw error
  }
}


/**
 * Validate if a document can be saved without exceeding storage limits.
 *
 * Helper function that checks if saving a document would exceed the user's
 * storage quota. Calculates document size and performs storage validation.
 * Throws an error if validation fails.
 *
 * Called from DocumentService update and create methods.
 *
 * @param content - The document content to validate
 * @param userId - The user ID to validate storage limits for
 * @throws Error if storage limit would be exceeded
 * @returns Promise that resolves if validation passes
 */
export async function validateDocumentStorage(content: string, userId: string): Promise<void> {
  try {
    const documentSize = calculateDocumentSize(content)
    const storageSubscriptionUsage = await getStorageSubscriptionUsage(userId)
    const wouldExceedLimit = (storageSubscriptionUsage.usage.totalBytes + documentSize) > storageSubscriptionUsage.limit

    if (wouldExceedLimit) {
      throw new Error(SubscriptionErrorCode.STORAGE_LIMIT_EXCEEDED)
    }

  } catch (error) {
    logger.error('Error checking storage limit', error as Error, { userId })
    throw error
  }

}