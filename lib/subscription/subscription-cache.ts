/**
 * Redis-based caching layer for subscription data that changes infrequently
 * Uses Upstash Redis for reliable caching across serverless function instances
 * This reduces database load for frequently accessed user subscription information
 */

import { Redis } from '@upstash/redis'
import { logger } from '../logger'

// Initialize Redis client with explicit Vercel environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Environment-based prefix to separate dev/prod cache data
const getEnvironmentPrefix = (): string => {
  return process.env.NODE_ENV === 'production' ? 'prod:' : 'dev:'
}

// Redis cache key prefixes
const CACHE_PREFIXES = {
  SUBSCRIPTION: 'sub:',
  USAGE: 'usage:',
  STORAGE: 'storage:',
  CLIENT_COUNT: 'client_count:'
} as const

// Helper functions for cache keys with environment separation
const getCacheKey = (prefix: string, userId: string, suffix?: string) => {
  const envPrefix = getEnvironmentPrefix()
  return suffix ? `${envPrefix}${prefix}${userId}:${suffix}` : `${envPrefix}${prefix}${userId}`
}

// Cache durations in seconds (Redis uses seconds for TTL)
const SUBSCRIPTION_CACHE_TTL = 60 * 60 // 1 hour (subscription data changes rarely)
const USAGE_CACHE_TTL = 2 * 60 // 2 minutes
const STORAGE_CACHE_TTL = 5 * 60 // 5 minutes (storage data changes rarely)
const CLIENT_COUNT_CACHE_TTL = 60 // 1 minute (client count changes occasionally)

/**
 * Cache subscription data with TTL
 */
export async function cacheSubscription(userId: string, subscription: any): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.SUBSCRIPTION, userId)
    await redis.setex(key, SUBSCRIPTION_CACHE_TTL, JSON.stringify(subscription))
  } catch (error) {
    logger.error('Error caching subscription', error as Error)
    // Fail silently - app should work without cache
  }
}

/**
 * Get cached subscription data if valid
 */
export async function getCachedSubscription(userId: string): Promise<any | null> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.SUBSCRIPTION, userId)
    const cached = await redis.get(key)
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached)
    }
    return cached // Redis returns null if key doesn't exist or expired
  } catch (error) {
    logger.error('Error getting cached subscription', error as Error)
    return null // Fall back to no cache
  }
}

/**
 * Cache usage data with shorter TTL
 */
export async function cacheUsage(cacheKey: string, usage: any): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.USAGE, cacheKey)
    await redis.setex(key, USAGE_CACHE_TTL, JSON.stringify(usage))
  } catch (error) {
    logger.error('Error caching usage', error as Error)
    // Fail silently - app should work without cache
  }
}

/**
 * Cache storage analytics data
 */
export async function cacheStorageAnalytics(userId: string, analytics: any): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.STORAGE, userId)
    await redis.setex(key, STORAGE_CACHE_TTL, JSON.stringify(analytics))
  } catch (error) {
    logger.error('Error caching storage analytics', error as Error)
    // Fail silently - app should work without cache
  }
}

/**
 * Cache client count data
 */
export async function cacheClientCount(userId: string, count: number): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.CLIENT_COUNT, userId)
    await redis.setex(key, CLIENT_COUNT_CACHE_TTL, count.toString())
  } catch (error) {
    logger.error('Error caching client count', error as Error)
    // Fail silently - app should work without cache
  }
}

/**
 * Get cached usage data if valid
 */
export async function getCachedUsage(cacheKey: string): Promise<any | null> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.USAGE, cacheKey)
    const cached = await redis.get(key)
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached)
    }
    return cached // Redis returns null if key doesn't exist or expired
  } catch (error) {
    logger.error('Error getting cached usage', error as Error)
    return null // Fall back to no cache
  }
}

/**
 * Get cached storage analytics data if valid
 */
export async function getCachedStorageAnalytics(userId: string): Promise<any | null> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.STORAGE, userId)
    const cached = await redis.get(key)
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached)
    }
    return cached // Redis returns null if key doesn't exist or expired
  } catch (error) {
    logger.error('Error getting cached storage analytics', error as Error)
    return null // Fall back to no cache
  }
}

/**
 * Get cached client count if valid
 */
export async function getCachedClientCount(userId: string): Promise<number | null> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.CLIENT_COUNT, userId)
    const cached = await redis.get(key)
    if (cached !== null && cached !== undefined) {
      return parseInt(cached.toString())
    }
    return null
  } catch (error) {
    logger.error('Error getting cached client count', error as Error)
    return null // Fall back to no cache
  }
}

/**
 * Invalidate subscription cache for a user (call when subscription changes)
 */
export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.SUBSCRIPTION, userId)
    await redis.del(key)
  } catch (error) {
    logger.error('Error invalidating subscription cache', error as Error)
    // Fail silently
  }
}

/**
 * Invalidate usage cache for a user (call when usage changes)
 */
export async function invalidateUsageCache(cacheKey: string): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.USAGE, cacheKey)
    await redis.del(key)
  } catch (error) {
    logger.error('Error invalidating usage cache', error as Error)
    // Fail silently
  }
}

/**
 * Invalidate storage analytics cache for a user (call when storage changes)
 */
export async function invalidateStorageCache(userId: string): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.STORAGE, userId)
    await redis.del(key)
  } catch (error) {
    logger.error('Error invalidating storage cache', error as Error)
    // Fail silently
  }
}

/**
 * Invalidate client count cache for a user (call when client count changes)
 */
export async function invalidateClientCountCache(userId: string): Promise<void> {
  try {
    const key = getCacheKey(CACHE_PREFIXES.CLIENT_COUNT, userId)
    await redis.del(key)
  } catch (error) {
    logger.error('Error invalidating client count cache', error as Error)
    // Fail silently
  }
}

/**
 * Invalidate all user-specific caches (call after subscription changes)
 * This ensures complete cache refresh after subscription upgrades/downgrades
 */
export async function invalidateAllUserCaches(userId: string): Promise<void> {
  try {
    // Invalidate subscription cache
    await invalidateSubscriptionCache(userId)
    
    // Invalidate current month usage cache
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const usageCacheKey = `${userId}_${year}_${month}`
    await invalidateUsageCache(usageCacheKey)
    
    // Invalidate storage analytics cache
    await invalidateStorageCache(userId)
    
    // Invalidate client count cache
    await invalidateClientCountCache(userId)
  } catch (error) {
    logger.error('Error invalidating all user caches', error as Error)
    // Fail silently - cache invalidation should not break functionality
  }
}

/**
 * Clear all caches (useful for testing and admin operations)
 */
export async function clearAllCaches(): Promise<void> {
  try {
    // Use Redis FLUSHALL to clear all keys
    // Warning: This clears ALL data in the Redis database
    await redis.flushall()
  } catch (error) {
    logger.error('Error clearing all caches', error as Error)
    throw error
  }
} 