import { stripe } from '@/lib/stripe/stripe'
import { logger } from '@/lib/logger'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/api/api-middleware'
import { SubscriptionUsageOperations } from '@/database'

export const POST = withEnhancedApi(
  async ({ userId }: ApiContext) => {
    // Get current subscription
    const subscription = await SubscriptionUsageOperations.findByUserId(userId)

    if (!subscription?.stripeSubscriptionId || !subscription?.stripeCustomerId) {
      logger.warn('No active Stripe subscription found for payment retry', { 
        userId,
        metadata: {
          hasSubscriptionId: !!subscription?.stripeSubscriptionId,
          hasCustomerId: !!subscription?.stripeCustomerId
        }
      })
      throw new Error('No active subscription found')
    }

    // Validate subscription is in past_due or unpaid status
    if (subscription.status !== 'past_due' && subscription.status !== 'unpaid') {
      logger.warn('Payment retry attempted for subscription not in past_due/unpaid status', {
        userId,
        metadata: {
          currentStatus: subscription.status,
          subscriptionId: subscription.stripeSubscriptionId
        }
      })
      throw new Error('Subscription is not in a payable state')
    }

    try {
      // Get unpaid invoices for this customer
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        status: 'open',
        limit: 10
      })

      logger.info('Retrieved unpaid invoices for payment retry', {
        userId,
        metadata: {
          invoiceCount: invoices.data.length,
          customerId: subscription.stripeCustomerId
        }
      })

      // Find the latest unpaid invoice for this subscription
      const unpaidInvoice = invoices.data.find(invoice => 
        invoice.lines.data[0]?.subscription === subscription.stripeSubscriptionId
      )

      if (!unpaidInvoice) {
        logger.warn('No unpaid invoice found for subscription', {
          userId,
          metadata: {
            subscriptionId: subscription.stripeSubscriptionId,
            totalInvoices: invoices.data.length
          }
        })
        throw new Error('No unpaid invoice found for this subscription')
      }

      logger.info('Found unpaid invoice, attempting payment', {
        userId,
        metadata: {
          invoiceId: unpaidInvoice.id,
          amount: unpaidInvoice.amount_due,
          subscriptionId: subscription.stripeSubscriptionId
        }
      })

      // Verify invoice has an ID before attempting payment
      if (!unpaidInvoice.id) {
        const error = Error('Invoice ID is missing - cannot process payment')
        logger.error('Invoice missing ID for payment', error, {
          userId,
          metadata: {
            subscriptionId: subscription.stripeSubscriptionId
          }
        })
        throw error
      }

      // Attempt to pay the invoice
      const paidInvoice = await stripe.invoices.pay(unpaidInvoice.id)

      logger.info('Invoice payment successful', {
        userId,
        metadata: {
          invoiceId: paidInvoice.id,
          status: paidInvoice.status,
          amountPaid: paidInvoice.amount_paid,
          subscriptionId: subscription.stripeSubscriptionId
        }
      })

      return apiSuccess({
        message: 'Payment successful! Your subscription has been restored.',
        invoiceId: paidInvoice.id,
        status: paidInvoice.status,
        amountPaid: paidInvoice.amount_paid
      })

    } catch (error) {
      const stripeError = error as any

      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        logger.warn('Card error during payment retry', {
          userId,
          metadata: {
            code: stripeError.code,
            declineCode: stripeError.decline_code,
            message: stripeError.message
          }
        })

        // Provide user-friendly error messages
        if (stripeError.code === 'insufficient_funds') {
          throw new Error('Payment failed due to insufficient funds. Please update your payment method or add funds to your account.')
        } else if (stripeError.code === 'card_declined') {
          throw new Error('Your card was declined. Please try a different payment method or contact your bank.')
        } else {
          throw new Error('Payment failed. Please check your payment method or try again later.')
        }
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        const error = Error('Unable to process payment. Please contact support.')
        logger.error('Invalid request during payment retry', error, {
          userId,
          metadata: {
            message: stripeError.message,
            param: stripeError.param
          }
        })
        throw error
      } else {
        logger.error('Unexpected error during payment retry', error as Error, {
          userId,
          metadata: {
            subscriptionId: subscription.stripeSubscriptionId,
            customerId: subscription.stripeCustomerId
          }
        })
        throw new Error('Payment processing failed. Please try again or contact support.')
      }
    }
  },
  { 
    context: 'Retry subscription payment',
    allowedMethods: ['POST']
  }
)