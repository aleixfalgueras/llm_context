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
      console.log('🔄 API: Cache bypass requested for subscription userId:', userId)
    }
    
    const subscriptionWithValidation = await SubscriptionUsageService.getUserSubscriptionWithValidation(userId, forceRefresh)
    
    return apiSuccess(subscriptionWithValidation)
  },
  { 
    context: 'Get subscription info',
    allowedMethods: ['GET']
  }
)