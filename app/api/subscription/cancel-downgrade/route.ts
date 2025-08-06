import { 
  withEnhancedApi, 
  apiSuccess, 
  ApiContext 
} from '@/lib/api/api-middleware'
import {SubscriptionUsageService} from '@/services/subscription-usage-service'

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    // Delegate all business logic to service layer
    const result = await SubscriptionUsageService.cancelDowngrade(userId)
    
    return apiSuccess(result)
  },
  { 
    context: 'Cancel subscription downgrade',
    allowedMethods: ['POST']
  }
)