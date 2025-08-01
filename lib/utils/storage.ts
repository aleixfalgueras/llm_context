import {prisma} from '../prisma'
import {logger} from '../logger'
import {SubscriptionUsageService} from '@/services/subscription-usage-service'

// Storage limits per plan (in bytes)
import {SubscriptionPlanType} from '@/lib/types/subscription-types'
import {cacheStorageSubscriptionUsage, getCachedStorageSubscriptionUsage} from "@/lib/subscription/subscription-cache";
import {SubscriptionPlan} from "@prisma/client";
import {StorageUsage, StorageSubscriptionUsage} from "@/lib/types/subscription-usage-types";
import {StorageUsageValidationResult} from "@/lib/types/middleware-validation-types";

export const STORAGE_LIMITS = {
  [SubscriptionPlan.basic]: 50 * 1024 * 1024,    // 50 MB for basic plan
  [SubscriptionPlan.pro]: 200 * 1024 * 1024,     // 200 MB for pro plan
  [SubscriptionPlan.business]: 2 * 1024 * 1024 * 1024, // 2 GB for business plan
} as const

export function getStorageLimitForPlan(plan: SubscriptionPlanType): number {
  switch (plan) {
    case SubscriptionPlan.basic:
      return STORAGE_LIMITS[SubscriptionPlan.basic]
    case SubscriptionPlan.pro:
      return STORAGE_LIMITS[SubscriptionPlan.pro]
    case SubscriptionPlan.business:
      return STORAGE_LIMITS[SubscriptionPlan.business]
    default:
      return STORAGE_LIMITS[SubscriptionPlan.basic] // Default to basic plan limits
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
      subscription ? Promise.resolve(subscription) : SubscriptionUsageService.getUserSubscription(userId),
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
 * Validate storage limits before document creation or upload.
 * 
 * Checks if adding a new document of specified size would exceed the user's
 * storage quota based on their subscription plan. Uses the optimized storage
 * analytics function for consistent data and caching benefits.
 * 
 * @param userId - The user ID to validate storage limits for
 * @param documentSizeBytes - Size of document to validate, defaults to 0 for current usage check
 * @returns Promise<StorageUsageValidationResult> with validation result and limit details
 * @throws Error if data fetching fails
 * 
 * **Architecture:**
 * - Uses getStorageSubscriptionUsage() for consistent data source
 * - Leverages existing caching and performance optimizations
 * - Returns standardized validation result interface
 */
export async function getStorageUsageValidationResult(userId: string, documentSizeBytes: number = 0): Promise<StorageUsageValidationResult> {
  try {
    const storageSubscriptionUsage = await getStorageSubscriptionUsage(userId)

    // Check if adding this document would exceed the limit
    const wouldExceedLimit = (storageSubscriptionUsage.usage.totalBytes + documentSizeBytes) > storageSubscriptionUsage.limit

    if (wouldExceedLimit) {
      return {
        allowed: false,
        limit: storageSubscriptionUsage.limit,
        used: storageSubscriptionUsage.usage.totalBytes,
        remaining: Math.max(0, storageSubscriptionUsage.limit - storageSubscriptionUsage.usage.totalBytes),
        limitType: 'storage',
        message: `Storage limit exceeded. Document size: ${formatBytes(documentSizeBytes)}, Available: ${formatBytes(Math.max(0, storageSubscriptionUsage.limit - storageSubscriptionUsage.usage.totalBytes))}`
      }
    }

    return {
      allowed: true,
      limit: storageSubscriptionUsage.limit,
      used: storageSubscriptionUsage.usage.totalBytes,
      remaining: storageSubscriptionUsage.limit - storageSubscriptionUsage.usage.totalBytes,
      limitType: 'storage'
    }
  } catch (error) {
    logger.error('Error checking storage limit', error as Error, { userId })
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
  const documentSize = calculateDocumentSize(content)
  const storageUsageValidationResult = await getStorageUsageValidationResult(userId, documentSize)

  if (!storageUsageValidationResult.allowed) {
    throw new Error(storageUsageValidationResult.message || 'Storage limit exceeded')
  }
}