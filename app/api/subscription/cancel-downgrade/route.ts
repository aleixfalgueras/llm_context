import { 
  withEnhancedApi, 
  apiSuccess, 
  ApiContext 
} from '@/lib/api/api-middleware'
import {SubscriptionService} from '@/services/subscription-service'

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    // Delegate all business logic to service layer
    const result = await SubscriptionService.cancelDowngrade(userId)
    
    return apiSuccess(result)
  },
  { 
    context: 'Cancel subscription downgrade',
    allowedMethods: ['POST']
  }
)