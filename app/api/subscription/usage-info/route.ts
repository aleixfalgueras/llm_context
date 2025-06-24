import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUsageInfo } from '@/lib/usage-middleware'
import { logger, withTiming } from '@/lib/logger'

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