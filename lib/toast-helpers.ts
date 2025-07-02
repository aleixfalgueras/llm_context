/**
 * Centralized toast notification helpers to eliminate duplicate toast patterns
 * across components. Provides consistent messaging and error handling.
 */

import { toast } from '@/hooks/use-toast'

/**
 * Success toast notifications
 */
export const successToasts = {
  clientCreated: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" created successfully` }),
  
  clientUpdated: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" updated successfully` }),
  
  clientDeleted: (name: string) => 
    toast({ title: 'Success', description: `Client "${name}" deleted successfully` }),
  
  promptCreated: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" created successfully` }),
  
  promptUpdated: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" updated successfully` }),
  
  promptDeleted: (name: string) => 
    toast({ title: 'Success', description: `Prompt "${name}" deleted successfully` }),
  
  documentCreated: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" created successfully` }),
  
  documentSaved: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" saved successfully` }),
  
  documentDeleted: (name: string) => 
    toast({ title: 'Success', description: `Document "${name}" deleted successfully` }),
  
  chatExported: () => 
    toast({ title: 'Success', description: 'Chat exported successfully' }),
  
  feedbackSubmitted: () => 
    toast({ title: 'Success', description: 'Feedback submitted successfully' }),
  
  settingsSaved: () => 
    toast({ title: 'Success', description: 'Settings saved successfully' }),
  
  dataExported: () => 
    toast({ title: 'Success', description: 'Data exported successfully' }),
  
  fileUploaded: (filename: string) => 
    toast({ title: 'Success', description: `File "${filename}" uploaded successfully` })
}

/**
 * Error toast notifications
 */
export const errorToasts = {
  generic: (operation: string) => 
    toast({ title: 'Error', description: `Failed to ${operation}. Please try again.`, variant: 'destructive' }),
  
  clientNotFound: () => 
    toast({ title: 'Error', description: 'Client not found', variant: 'destructive' }),
  
  clientCreateFailed: () => 
    toast({ title: 'Error', description: 'Failed to create client. Please try again.', variant: 'destructive' }),
  
  clientUpdateFailed: () => 
    toast({ title: 'Error', description: 'Failed to update client. Please try again.', variant: 'destructive' }),
  
  clientDeleteFailed: () => 
    toast({ title: 'Error', description: 'Failed to delete client. Please try again.', variant: 'destructive' }),
  
  promptNotFound: () => 
    toast({ title: 'Error', description: 'Prompt not found', variant: 'destructive' }),
  
  promptCreateFailed: () => 
    toast({ title: 'Error', description: 'Failed to create prompt. Please try again.', variant: 'destructive' }),
  
  promptUpdateFailed: () => 
    toast({ title: 'Error', description: 'Failed to update prompt. Please try again.', variant: 'destructive' }),
  
  promptDeleteFailed: () => 
    toast({ title: 'Error', description: 'Failed to delete prompt. Please try again.', variant: 'destructive' }),
  
  documentGenerationFailed: () => 
    toast({ title: 'Error', description: 'Failed to generate document. Please try again.', variant: 'destructive' }),
  
  documentSaveFailed: () => 
    toast({ title: 'Error', description: 'Failed to save document. Please try again.', variant: 'destructive' }),
  
  documentLoadFailed: () => 
    toast({ title: 'Error', description: 'Failed to load document. Please try again.', variant: 'destructive' }),
  
  chatLoadFailed: () => 
    toast({ title: 'Error', description: 'Failed to load chat. Please try again.', variant: 'destructive' }),
  
  chatSendFailed: () => 
    toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' }),
  
  fileUploadFailed: (reason?: string) => 
    toast({ title: 'Error', description: `File upload failed${reason ? `: ${reason}` : '. Please try again.'}`, variant: 'destructive' }),
  
  fileTooLarge: (maxSize: string) => 
    toast({ title: 'Error', description: `File too large. Maximum size is ${maxSize}`, variant: 'destructive' }),
  
  invalidFileType: (allowedTypes: string) => 
    toast({ title: 'Error', description: `Invalid file type. Allowed types: ${allowedTypes}`, variant: 'destructive' }),
  
  networkError: () => 
    toast({ title: 'Error', description: 'Network error. Please check your connection and try again.', variant: 'destructive' }),
  
  unauthorized: () => 
    toast({ title: 'Error', description: 'You are not authorized to perform this action', variant: 'destructive' }),
  
  rateLimitExceeded: () => 
    toast({ title: 'Error', description: 'Rate limit exceeded. Please wait a moment and try again.', variant: 'destructive' }),
  
  validationError: (message: string) => 
    toast({ title: 'Error', description: `Validation error: ${message}`, variant: 'destructive' }),
  
  serverError: () => 
    toast({ title: 'Error', description: 'Server error. Please try again later.', variant: 'destructive' }),
  
  featureNotAvailable: () => 
    toast({ title: 'Error', description: 'This feature is not available in your current plan', variant: 'destructive' })
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
    toast({ title: 'Session Expired', description: 'Your session has expired. Please sign in again.', variant: 'destructive' })
}

/**
 * Warning toast notifications
 */
export const warningToasts = {
  unsavedChanges: () => 
    toast({ 
      title: 'Unsaved Changes', 
      description: 'Make sure to save before leaving',
      variant: 'destructive'
    }),
  
  confirmDelete: (item: string) => 
    toast({ 
      title: 'Confirm Delete',
      description: `Are you sure you want to delete "${item}"? This action cannot be undone.`,
      variant: 'destructive'
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
  const variant = type === 'error' || type === 'warning' ? 'destructive' : undefined
  
  return toast({
    title: message,
    description: options?.description,
    variant,
    duration: options?.duration
  })
}