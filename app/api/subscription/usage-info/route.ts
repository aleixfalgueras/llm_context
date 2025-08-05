import {
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/api/api-middleware'
import {SubscriptionUsageService} from "@/services/subscription-usage-service";

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const url = new URL(req.url)
    const forceRefresh = url.searchParams.has('t')
    
    if (forceRefresh) {
      console.log('🔄 API: Cache bypass requested for userId:', userId)
    }
    
    const usageInfo = await SubscriptionUsageService.getUserUsageInfo(userId, forceRefresh)
    
    if (!usageInfo) {
      const error = new Error('Failed to fetch usage information')
      ;(error as any).status = 500
      throw error
    }
    
    return apiSuccess(usageInfo)
  },
  { 
    context: 'Get usage info',
    allowedMethods: ['GET']
  }
) 