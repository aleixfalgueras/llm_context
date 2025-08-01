/**
 * Centralize file that provides toasts for API-actions error response codes.
 *
 */

import {toast} from '@/hooks/use-toast'
import {ToastVariant} from '@/lib/types/enums'
import {SubscriptionErrorCode} from './api-error-codes'


export const errorToasts = {
  generic: (errorMessage: string) =>
    toast({ title: 'Error', description: errorMessage, variant: ToastVariant.DESTRUCTIVE }),
  
  unauthorized: () => 
    toast({ title: 'Error', description: 'You are not authorized to perform this action', variant: ToastVariant.DESTRUCTIVE }),

  subscriptionExpired: () =>
    toast({ 
      title: 'Subscription Expired', 
      description: 'Your subscription has expired. Read-only access is still available.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  usageLimitExceeded: (errorMessage: string) =>
    toast({
      title: 'Usage Limit Exceeded',
      description: `${errorMessage} Please upgrade your plan to continue.`,
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  modelAccessDenied: (errorMessage: string) =>
    toast({
      title: 'Model Access Denied',
      description: `${errorMessage} Please upgrade your plan to continue.`,
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  noSubscriptionFound: () =>
    toast({
      title: 'No Subscription Found',
      description: 'No active subscription found. Please subscribe to a plan to continue.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    })

}

/**
 * Handle API-actions errors with consistent toast notifications for client-side usage.
 */
export function handleClientApiError(errorMessage: string, fallbackMessage: string = 'An error occurred') {
  switch (errorMessage) {
    case SubscriptionErrorCode.SUBSCRIPTION_EXPIRED:
      return errorToasts.subscriptionExpired()
    
    case SubscriptionErrorCode.USAGE_LIMIT_EXCEEDED:
      return errorToasts.usageLimitExceeded(errorMessage)
    
    case SubscriptionErrorCode.MODEL_ACCESS_DENIED:
      return errorToasts.modelAccessDenied(errorMessage)
    
    case SubscriptionErrorCode.NO_SUBSCRIPTION_FOUND:
      return errorToasts.noSubscriptionFound()
    
    default:
      return errorToasts.generic(errorMessage || fallbackMessage)
  }
}