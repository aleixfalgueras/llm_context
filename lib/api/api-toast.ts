/**
 * Centralize file that provides toasts for API-actions error response codes.
 *
 */

import {toast} from '@/hooks/use-toast'
import {ToastVariant} from '@/lib/types/enums'
import {SubscriptionErrorCode} from '@/services/error-codes'


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

  usageLimitExceeded: () =>
    toast({
      title: 'Usage Limit Exceeded',
      description: 'You have reached your tokens usage limit. Please upgrade your plan to continue.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  modelAccessDenied: () =>
    toast({
      title: 'Model Access Denied',
      description: 'This model is not available on your current plan. Please upgrade to access this model.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  noSubscriptionFound: () =>
    toast({
      title: 'No Subscription Found',
      description: 'No active subscription found. Please subscribe to a plan to continue.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    }),

  storageLimitExceeded: () =>
    toast({
      title: 'Storage Limit Exceeded',
      description: 'You have reached your storage limit. Please upgrade your plan or delete some documents to continue.',
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
      return errorToasts.usageLimitExceeded()
    
    case SubscriptionErrorCode.MODEL_ACCESS_DENIED:
      return errorToasts.modelAccessDenied()
    
    case SubscriptionErrorCode.NO_SUBSCRIPTION_FOUND:
      return errorToasts.noSubscriptionFound()
    
    case SubscriptionErrorCode.STORAGE_LIMIT_EXCEEDED:
      return errorToasts.storageLimitExceeded()
    
    default:
      return errorToasts.generic(errorMessage || fallbackMessage)
  }
}