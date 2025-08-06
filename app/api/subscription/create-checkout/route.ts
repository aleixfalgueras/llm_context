import {logger} from '@/lib/logger'
import {ApiContext, apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {SubscriptionPlan} from "@prisma/client";
import {SubscriptionUsageService} from '@/services/subscription-usage-service'

interface CheckoutResponse {
  isDowngrade: boolean
  message?: string
  effectiveDate?: string
  url?: string | null
}

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId } = await parseJsonBody(req)

    // Delegate all business logic to service layer
    const response = await SubscriptionUsageService.createCheckoutSession(userId, planId as SubscriptionPlan)
    
    return apiSuccess(response)
  },
  { 
    context: 'Create checkout session',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)