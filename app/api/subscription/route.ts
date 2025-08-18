import {
  withEnhancedApi,
  apiSuccess,
  ApiContext
} from '@/lib/api/api-middleware'
import {SubscriptionService} from "@/services/subscription/subscription-service";

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const url = new URL(req.url)
    const forceRefresh = url.searchParams.has('t')
    
    if (forceRefresh) {
      console.log('🔄 API: Cache bypass requested for subscription userId:', userId)
    }
    
    const subscriptionWithValidation = await SubscriptionService.getUserSubscriptionWithValidation(userId, forceRefresh)
    
    return apiSuccess(subscriptionWithValidation)
  },
  { 
    context: 'Get subscription info',
    allowedMethods: ['GET']
  }
)