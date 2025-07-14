/**
 * Simple caching layer for subscription data that changes infrequently
 * This reduces database load for frequently accessed user subscription information
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface SubscriptionCache {
  [userId: string]: CacheEntry<any>
}

interface UsageCache {
  [userId: string]: CacheEntry<any>
}

interface StorageCache {
  [userId: string]: CacheEntry<any>
}

interface ClientCountCache {
  [userId: string]: CacheEntry<any>
}

// In-memory caches with TTL
const subscriptionCache: SubscriptionCache = {}
const usageCache: UsageCache = {}
const storageCache: StorageCache = {}
const clientCountCache: ClientCountCache = {}

// Cache durations
const SUBSCRIPTION_CACHE_TTL = 60 * 60 * 1000 // 1 hour (subscription data changes rarely)
const USAGE_CACHE_TTL = 2 * 60 * 1000 // 2 minutes
const STORAGE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes (storage data changes rarely)
const CLIENT_COUNT_CACHE_TTL = 1 * 60 * 1000 // 1 minute (client count changes occasionally)

/**
 * Cache subscription data with TTL
 */
export function cacheSubscription(userId: string, subscription: any): void {
  const now = Date.now()
  subscriptionCache[userId] = {
    data: subscription,
    timestamp: now,
    expiresAt: now + SUBSCRIPTION_CACHE_TTL
  }
  
  // Clean up old entries periodically
  if (Object.keys(subscriptionCache).length > 500) {
    cleanupCache(subscriptionCache)
  }
}

/**
 * Get cached subscription data if valid
 */
export function getCachedSubscription(userId: string): any | null {
  const entry = subscriptionCache[userId]
  if (!entry) return null
  
  const now = Date.now()
  if (now > entry.expiresAt) {
    delete subscriptionCache[userId]
    return null
  }
  
  return entry.data
}

/**
 * Cache usage data with shorter TTL
 */
export function cacheUsage(userId: string, usage: any): void {
  const now = Date.now()
  usageCache[userId] = {
    data: usage,
    timestamp: now,
    expiresAt: now + USAGE_CACHE_TTL
  }
  
  // Clean up old entries periodically
  if (Object.keys(usageCache).length > 500) {
    cleanupCache(usageCache)
  }
}

/**
 * Cache storage analytics data
 */
export function cacheStorageAnalytics(userId: string, analytics: any): void {
  const now = Date.now()
  storageCache[userId] = {
    data: analytics,
    timestamp: now,
    expiresAt: now + STORAGE_CACHE_TTL
  }
  
  // Clean up old entries periodically
  if (Object.keys(storageCache).length > 500) {
    cleanupCache(storageCache)
  }
}

/**
 * Cache client count data
 */
export function cacheClientCount(userId: string, count: number): void {
  const now = Date.now()
  clientCountCache[userId] = {
    data: count,
    timestamp: now,
    expiresAt: now + CLIENT_COUNT_CACHE_TTL
  }
  
  // Clean up old entries periodically
  if (Object.keys(clientCountCache).length > 500) {
    cleanupCache(clientCountCache)
  }
}

/**
 * Get cached usage data if valid
 */
export function getCachedUsage(userId: string): any | null {
  const entry = usageCache[userId]
  if (!entry) return null
  
  const now = Date.now()
  if (now > entry.expiresAt) {
    delete usageCache[userId]
    return null
  }
  
  return entry.data
}

/**
 * Get cached storage analytics data if valid
 */
export function getCachedStorageAnalytics(userId: string): any | null {
  const entry = storageCache[userId]
  if (!entry) return null
  
  const now = Date.now()
  if (now > entry.expiresAt) {
    delete storageCache[userId]
    return null
  }
  
  return entry.data
}

/**
 * Get cached client count if valid
 */
export function getCachedClientCount(userId: string): number | null {
  const entry = clientCountCache[userId]
  if (!entry) return null
  
  const now = Date.now()
  if (now > entry.expiresAt) {
    delete clientCountCache[userId]
    return null
  }
  
  return entry.data
}

/**
 * Invalidate subscription cache for a user (call when subscription changes)
 */
export function invalidateSubscriptionCache(userId: string): void {
  delete subscriptionCache[userId]
}

/**
 * Invalidate usage cache for a user (call when usage changes)
 */
export function invalidateUsageCache(userId: string): void {
  delete usageCache[userId]
}

/**
 * Invalidate storage analytics cache for a user (call when storage changes)
 */
export function invalidateStorageCache(userId: string): void {
  delete storageCache[userId]
}

/**
 * Invalidate client count cache for a user (call when client count changes)
 */
export function invalidateClientCountCache(userId: string): void {
  delete clientCountCache[userId]
}

/**
 * Clean up expired cache entries
 */
function cleanupCache(cache: SubscriptionCache | UsageCache | StorageCache | ClientCountCache): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  for (const [userId, entry] of Object.entries(cache)) {
    if (now > entry.expiresAt) {
      keysToDelete.push(userId)
    }
  }
  
  keysToDelete.forEach(userId => delete cache[userId])
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  const now = Date.now()
  
  const subscriptionStats = {
    total: Object.keys(subscriptionCache).length,
    expired: Object.values(subscriptionCache).filter(entry => now > entry.expiresAt).length
  }
  
  const usageStats = {
    total: Object.keys(usageCache).length,
    expired: Object.values(usageCache).filter(entry => now > entry.expiresAt).length
  }
  
  const storageStats = {
    total: Object.keys(storageCache).length,
    expired: Object.values(storageCache).filter(entry => now > entry.expiresAt).length
  }
  
  const clientCountStats = {
    total: Object.keys(clientCountCache).length,
    expired: Object.values(clientCountCache).filter(entry => now > entry.expiresAt).length
  }
  
  return {
    subscription: subscriptionStats,
    usage: usageStats,
    storage: storageStats,
    clientCount: clientCountStats
  }
}

/**
 * Clear all caches (useful for testing)
 */
export function clearAllCaches(): void {
  Object.keys(subscriptionCache).forEach(key => delete subscriptionCache[key])
  Object.keys(usageCache).forEach(key => delete usageCache[key])
  Object.keys(storageCache).forEach(key => delete storageCache[key])
  Object.keys(clientCountCache).forEach(key => delete clientCountCache[key])
} 