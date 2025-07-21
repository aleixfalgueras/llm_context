import {prisma} from '../prisma'
import {logger} from '../logger'
import {auth} from '@clerk/nextjs/server'
import {getUserSubscription} from '../subscription/subscription-utils'

// Storage limits per plan (in bytes)
import {SubscriptionPlan, SubscriptionPlanType} from '@/types/subscription-types'
import {cacheStorageAnalytics, getCachedStorageAnalytics} from "@/lib/subscription/subscription-cache";

export const STORAGE_LIMITS = {
  [SubscriptionPlan.BASIC]: 50 * 1024 * 1024,    // 50 MB for basic plan
  [SubscriptionPlan.PRO]: 200 * 1024 * 1024,     // 200 MB for pro plan
  [SubscriptionPlan.BUSINESS]: 2 * 1024 * 1024 * 1024, // 2 GB for business plan
} as const

export interface StorageCheckResult {
  allowed: boolean
  limit: number
  used: number
  remaining?: number
  limitType: 'storage'
  message?: string
}

export interface StorageUsage {
  totalBytes: number
  documentCount: number
  usageByClient: Record<string, number>
}

/**
 * Check if user has enough storage space for a new document
 */
export async function checkStorageLimit(userId: string, documentSizeBytes: number): Promise<StorageCheckResult> {
  try {
    const subscription = await getUserSubscription(userId)
    const storageUsage = await getCurrentStorageUsage(userId)
    
    // Get storage limit based on plan
    const storageLimit = getStorageLimitForPlan(subscription.plan)
    
    // Check if adding this document would exceed the limit
    const wouldExceedLimit = (storageUsage.totalBytes + documentSizeBytes) > storageLimit
    
    if (wouldExceedLimit) {
      return {
        allowed: false,
        limit: storageLimit,
        used: storageUsage.totalBytes,
        remaining: Math.max(0, storageLimit - storageUsage.totalBytes),
        limitType: 'storage',
        message: `Storage limit exceeded. Document size: ${formatBytes(documentSizeBytes)}, Available: ${formatBytes(Math.max(0, storageLimit - storageUsage.totalBytes))}`
      }
    }

    return {
      allowed: true,
      limit: storageLimit,
      used: storageUsage.totalBytes,
      remaining: storageLimit - storageUsage.totalBytes,
      limitType: 'storage'
    }
  } catch (error) {
    logger.error('Error checking storage limit', error as Error, { userId })
    throw error
  }
}

/**
 * Get current storage usage for a user
 */
export async function getCurrentStorageUsage(userId: string): Promise<StorageUsage> {
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
 * Get storage limit for a subscription plan
 */
export function getStorageLimitForPlan(plan: SubscriptionPlanType): number {
  switch (plan) {
    case SubscriptionPlan.BASIC:
      return STORAGE_LIMITS[SubscriptionPlan.BASIC]
    case SubscriptionPlan.PRO:
      return STORAGE_LIMITS[SubscriptionPlan.PRO]
    case SubscriptionPlan.BUSINESS:
      return STORAGE_LIMITS[SubscriptionPlan.BUSINESS]
    default:
      return STORAGE_LIMITS[SubscriptionPlan.BASIC] // Default to basic plan limits
  }
}

/**
 * Calculate the size of a document in bytes
 */
export function calculateDocumentSize(content: string): number {
  // Calculate size in bytes (UTF-8 encoding)
  return new Blob([content]).size
}

/**
 * Format bytes into a human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get storage analytics for a user
 */
export async function getStorageAnalytics(userId: string, subscription?: any) {
  try {
    // Check cache first
    const cached = await getCachedStorageAnalytics(userId)
    if (cached) {
      return cached
    }

    // If subscription is provided, use it; otherwise fetch it
    const [userSubscription, storageUsage] = await Promise.all([
      subscription ? Promise.resolve(subscription) : getUserSubscription(userId),
      getCurrentStorageUsage(userId)
    ])

    const storageLimit = getStorageLimitForPlan(userSubscription.plan)
    
    const analytics = {
      usage: storageUsage,
      limit: storageLimit,
      limitFormatted: formatBytes(storageLimit),
      usedFormatted: formatBytes(storageUsage.totalBytes),
      usagePercentage: Math.round((storageUsage.totalBytes / storageLimit) * 100),
      remainingFormatted: formatBytes(Math.max(0, storageLimit - storageUsage.totalBytes))
    }

    // Cache the result
    await cacheStorageAnalytics(userId, analytics)
    
    return analytics
  } catch (error) {
    logger.error('Error getting storage analytics', error as Error, { userId })
    throw error
  }
}

/**
 * Validate if a document can be saved (helper function for API routes)
 */
export async function validateDocumentStorage(content: string, userId?: string): Promise<void> {
  const { userId: authUserId } = userId ? { userId } : await auth()
  
  if (!authUserId) {
    throw new Error('Unauthorized')
  }

  const documentSize = calculateDocumentSize(content)
  const storageCheck = await checkStorageLimit(authUserId, documentSize)

  if (!storageCheck.allowed) {
    throw new Error(storageCheck.message || 'Storage limit exceeded')
  }
}

/**
 * Check if user is approaching storage limit (80% threshold)
 */
export async function isApproachingStorageLimit(userId: string, subscription?: any): Promise<boolean> {
  try {
    const userSubscription = subscription || await getUserSubscription(userId)
    const storageUsage = await getCurrentStorageUsage(userId)
    const storageLimit = getStorageLimitForPlan(userSubscription.plan)

    const usagePercentage = (storageUsage.totalBytes / storageLimit) * 100
    return usagePercentage >= 80
  } catch (error) {
    logger.error('Error checking storage limit threshold', error as Error, { userId })
    return false
  }
} 