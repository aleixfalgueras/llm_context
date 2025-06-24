import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsageInfo } from '@/lib/usage-middleware'
import { logger, withTiming } from '@/lib/logger'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// Simple in-memory cache for usage info to prevent excessive DB queries
const usageCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

export async function GET() {
  const endTiming = logger.startTiming('Usage Info API');
  
  try {
    logger.apiRequest('GET', '/api/subscription/usage-info');
    const { userId } = await auth()
    
    if (!userId) {
      logger.warn('Unauthorized access to usage info API');
      logger.apiResponse('GET', '/api/subscription/usage-info', 401);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first to prevent duplicate DB queries
    const cacheKey = `usage_${userId}`
    const cached = usageCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.debug('Returning cached usage info', { userId })
      logger.apiResponse('GET', '/api/subscription/usage-info', 200, { userId });
      endTiming();
      return NextResponse.json(cached.data)
    }

    const usageInfo = await withTiming(
      'Get usage info',
      () => getUsageInfo(userId),
      { userId },
      1000 // Usage info should be fast - warn if >1 second
    );
    
    if (!usageInfo) {
      logger.error('Failed to fetch usage information - null response', undefined, { userId });
      logger.apiResponse('GET', '/api/subscription/usage-info', 500, { userId });
      return NextResponse.json(
        { error: 'Failed to fetch usage information' },
        { status: 500 }
      )
    }

    // Cache the result
    usageCache.set(cacheKey, { data: usageInfo, timestamp: Date.now() })
    
    // Clean up old cache entries occasionally (simple LRU)
    if (usageCache.size > 100) {
      const oldestKey = usageCache.keys().next().value
      if (oldestKey) {
        usageCache.delete(oldestKey)
      }
    }
    
    logger.apiResponse('GET', '/api/subscription/usage-info', 200, { userId });
    endTiming();
    return NextResponse.json(usageInfo)
  } catch (error) {
    logger.error('Error fetching usage info', error as Error, { userId: 'unknown' });
    logger.apiResponse('GET', '/api/subscription/usage-info', 500);
    endTiming();
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 