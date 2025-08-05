import { createCustomerPortalSession } from '@/lib/stripe/stripe-utils'
import { logger } from '@/lib/logger'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/api/api-middleware'

import {SubscriptionErrorCode} from "@/lib/api/api-error-codes";

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    try {
      const portalSession = await createCustomerPortalSession(userId)

      logger.info('Customer portal session created successfully', { 
        userId, 
        metadata: {
          sessionId: portalSession.id 
        }
      })

      return apiSuccess({ url: portalSession.url })
    } catch (error) {
      if (error instanceof Error && error.message.includes('No Stripe customer found')) {
        logger.info('Customer portal access attempted during free trial period', { 
          userId,
          metadata: {
            message: 'User has no Stripe customer - expected behavior for free trial users'
          }
        })
        const noCustomerError = new Error('No active subscription found')
        ;(noCustomerError as any).status = 404
        ;(noCustomerError as any).code = SubscriptionErrorCode.NO_SUBSCRIPTION_FOUND
        throw noCustomerError
      }
      throw error
    }
  },
  { 
    context: 'Create customer portal session',
    allowedMethods: ['POST']
  }
)