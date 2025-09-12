import {ApiContext, apiSuccess, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'
import {BillingInterval, SubscriptionPlan} from "@prisma/client";
import {SubscriptionService} from '@/services/subscription/subscription-service'

export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { planId, billingInterval } = await parseJsonBody(req)

    // Delegate all business logic to service layer
    const response = await SubscriptionService.createCheckoutSession(
      userId, 
      planId as SubscriptionPlan,
      billingInterval as BillingInterval || BillingInterval.monthly
    )
    
    return apiSuccess(response)
  },
  { 
    context: 'Create checkout session',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
)