/**
 * Centralized toast notification helpers to eliminate duplicate toast patterns
 * across components. Provides consistent messaging and error handling.
 */

import { toast } from '@/hooks/use-toast'
import { ApiSubscriptionErrorCode, ToastVariant } from '@/types/enums'
import { 
  normalizeErrorData, 
  getErrorMetadata, 
  getErrorMessage,
  type ErrorData 
} from './error-code-utils'

/**
 * Success toast notifications
 */
export const successToasts = {
  clientCreated: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" created successfully`, variant: ToastVariant.SUCCESS }),
  
  clientUpdated: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" updated successfully`, variant: ToastVariant.SUCCESS }),
  
  clientDeleted: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" deleted successfully`, variant: ToastVariant.SUCCESS }),
  
  promptCreated: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" created successfully`, variant: ToastVariant.SUCCESS }),
  
  promptUpdated: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" updated successfully`, variant: ToastVariant.SUCCESS }),
  
  promptDeleted: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" deleted successfully`, variant: ToastVariant.SUCCESS }),
  
  documentCreated: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" created successfully`, variant: ToastVariant.SUCCESS }),
  
  documentSaved: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" saved successfully`, variant: ToastVariant.SUCCESS }),
  
  documentDeleted: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" deleted successfully`, variant: ToastVariant.SUCCESS }),
  
  chatExported: () => 
    toast({ title: 'Success', description: 'Chat exported successfully', variant: ToastVariant.SUCCESS }),
  
  feedbackSubmitted: () => 
    toast({ title: 'Success', description: 'Feedback submitted successfully', variant: ToastVariant.SUCCESS }),
  
  settingsSaved: () => 
    toast({ title: 'Success', description: 'Settings saved successfully', variant: ToastVariant.SUCCESS }),
  
  dataExported: () => 
    toast({ title: 'Success', description: 'Data exported successfully', variant: ToastVariant.SUCCESS }),
  
  fileUploaded: (filename: string) => 
    toast({ title: 'Success', description: `File "${filename}" uploaded successfully`, variant: ToastVariant.SUCCESS })
}

/**
 * Error toast notifications
 */
export const errorToasts = {
  generic: (operation: string) => 
    toast({ title: 'Error', description: `Failed to ${operation}. Please try again.`, variant: ToastVariant.DESTRUCTIVE }),
  
  clientNotFound: () => 
    toast({ title: 'Error', description: 'Client not found', variant: ToastVariant.DESTRUCTIVE }),
  
  clientCreateFailed: () => 
    toast({ title: 'Error', description: 'Failed to create client. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  clientUpdateFailed: () => 
    toast({ title: 'Error', description: 'Failed to update client. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  clientDeleteFailed: () => 
    toast({ title: 'Error', description: 'Failed to delete client. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  promptNotFound: () => 
    toast({ title: 'Error', description: 'Prompt not found', variant: ToastVariant.DESTRUCTIVE }),
  
  promptCreateFailed: () => 
    toast({ title: 'Error', description: 'Failed to create prompt. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  promptUpdateFailed: () => 
    toast({ title: 'Error', description: 'Failed to update prompt. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  promptDeleteFailed: () => 
    toast({ title: 'Error', description: 'Failed to delete prompt. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  documentGenerationFailed: () => 
    toast({ title: 'Error', description: 'Failed to generate document. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  documentSaveFailed: () => 
    toast({ title: 'Error', description: 'Failed to save document. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  documentLoadFailed: () => 
    toast({ title: 'Error', description: 'Failed to load document. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  chatLoadFailed: () => 
    toast({ title: 'Error', description: 'Failed to load chat. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  chatSendFailed: () => 
    toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  fileUploadFailed: (reason?: string) => 
    toast({ title: 'Error', description: `File upload failed${reason ? `: ${reason}` : '. Please try again.'}`, variant: ToastVariant.DESTRUCTIVE }),
  
  fileTooLarge: (maxSize: string) => 
    toast({ title: 'Error', description: `File too large. Maximum size is ${maxSize}`, variant: ToastVariant.DESTRUCTIVE }),
  
  invalidFileType: (allowedTypes: string) => 
    toast({ title: 'Error', description: `Invalid file type. Allowed types: ${allowedTypes}`, variant: ToastVariant.DESTRUCTIVE }),
  
  networkError: () => 
    toast({ title: 'Error', description: 'Network error. Please check your connection and try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  unauthorized: () => 
    toast({ title: 'Error', description: 'You are not authorized to perform this action', variant: ToastVariant.DESTRUCTIVE }),
  
  rateLimitExceeded: () => 
    toast({ title: 'Error', description: 'Rate limit exceeded. Please wait a moment and try again.', variant: ToastVariant.DESTRUCTIVE }),
  
  validationError: (message: string) => 
    toast({ title: 'Error', description: `Validation error: ${message}`, variant: ToastVariant.DESTRUCTIVE }),
  
  serverError: () => 
    toast({ title: 'Error', description: 'Server error. Please try again later.', variant: ToastVariant.DESTRUCTIVE }),
  
  featureNotAvailable: () => 
    toast({ title: 'Error', description: 'This feature is not available in your current plan', variant: ToastVariant.DESTRUCTIVE }),
  
  subscriptionExpired: (upgradeUrl: string = '/subscription') => 
    toast({ 
      title: 'Subscription Expired', 
      description: 'Your subscription has expired. Please upgrade to continue using write features. Read-only access is still available.',
      variant: ToastVariant.DESTRUCTIVE,
      duration: 10000
    })
}

/**
 * Info toast notifications
 */
export const infoToasts = {
  loading: (operation: string) => 
    toast({ title: 'Loading', description: `${operation}...` }),
  
  processingDocument: () => 
    toast({ title: 'Processing', description: 'Processing document...' }),
  
  generatingContent: () => 
    toast({ title: 'Generating', description: 'Generating content...' }),
  
  savingChanges: () => 
    toast({ title: 'Saving', description: 'Saving changes...' }),
  
  uploadingFile: () => 
    toast({ title: 'Uploading', description: 'Uploading file...' }),
  
  exportingData: () => 
    toast({ title: 'Exporting', description: 'Exporting data...' }),
  
  copied: (item: string) => 
    toast({ title: 'Copied', description: `${item} copied to clipboard` }),
  
  featureComingSoon: () => 
    toast({ title: 'Coming Soon', description: 'This feature is coming soon!' }),
  
  maxItemsReached: (limit: number) => 
    toast({ title: 'Limit Reached', description: `Maximum of ${limit} items allowed` }),
  
  noChangesDetected: () => 
    toast({ title: 'No Changes', description: 'No changes detected' }),
  
  sessionExpired: () => 
    toast({ title: 'Session Expired', description: 'Your session has expired. Please sign in again.', variant: ToastVariant.DESTRUCTIVE })
}

/**
 * Warning toast notifications
 */
export const warningToasts = {
  unsavedChanges: () => 
    toast({ 
      title: 'Unsaved Changes', 
      description: 'Make sure to save before leaving',
      variant: ToastVariant.DESTRUCTIVE
    }),
  
  confirmDelete: (item: string) => 
    toast({ 
      title: 'Confirm Delete',
      description: `Are you sure you want to delete "${item}"? This action cannot be undone.`,
      variant: ToastVariant.DESTRUCTIVE
    }),
  
  usageLimitApproaching: (percentage: number) => 
    toast({ 
      title: 'Usage Limit Warning',
      description: `You've used ${percentage}% of your monthly limit. Consider upgrading your plan.`
    }),
  
  storageAlmostFull: () => 
    toast({ 
      title: 'Storage Warning',
      description: 'Storage almost full. Consider cleaning up old files.'
    })
}

/**
 * Utility function to dismiss all toasts
 */
export function dismissAllToasts() {
  // Note: Implement dismiss all functionality based on your toast system
  // This would need to be implemented with your specific toast context
}

/**
 * Utility function to show custom toast with consistent styling
 */
export function showCustomToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  options?: {
    description?: string
    duration?: number
  }
) {
  let variant: ToastVariant | undefined
  
  switch (type) {
    case 'success':
      variant = ToastVariant.SUCCESS
      break
    case 'error':
    case 'warning':
      variant = ToastVariant.DESTRUCTIVE
      break
    case 'info':
    default:
      variant = ToastVariant.DEFAULT
      break
  }
  
  return toast({
    title: message,
    description: options?.description,
    variant,
    duration: options?.duration
  })
}

/**
 * Handle API errors with consistent toast notifications for client-side usage
 */
export function handleClientApiError(error: any, fallbackMessage: string = 'An error occurred') {
  // Handle Response objects
  if (error.json && typeof error.json === 'function') {
    return error.json().then((data: any) => {
      handleClientApiErrorData(data, fallbackMessage)
    }).catch(() => {
      errorToasts.generic(fallbackMessage)
    })
  }
  
  // Handle all other error types using shared utility
  const errorData = normalizeErrorData(error)
  return handleClientApiErrorData(errorData, fallbackMessage)
}

/**
 * Handle API error data objects for client-side toast notifications
 */
function handleClientApiErrorData(data: ErrorData, fallbackMessage: string) {
  const metadata = getErrorMetadata(data)
  const message = getErrorMessage(data)
  
  switch (data.code) {
    case ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED:
      return errorToasts.subscriptionExpired(metadata.upgradeUrl)
    
    case ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED:
      return toast({
        title: 'Usage Limit Exceeded',
        description: `${message} Please upgrade your plan to continue.`,
        variant: ToastVariant.DESTRUCTIVE,
        duration: 10000
      })
    
    case ApiSubscriptionErrorCode.MODEL_ACCESS_DENIED:
      return toast({
        title: 'Model Access Denied',
        description: `${message} Please upgrade your plan to continue.`,
        variant: ToastVariant.DESTRUCTIVE,
        duration: 10000
      })
    
    default:
      return errorToasts.generic(message || fallbackMessage)
  }
}