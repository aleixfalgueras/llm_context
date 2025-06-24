// Utility functions for checking document usage limits across the application

export interface DocumentUsageResult {
  allowed: boolean
  limit: number | 'unlimited'
  used: number
  remaining?: number
  message?: string
}

/**
 * Check if user can create a new document based on their usage limits
 * This is the main function to use throughout the app
 */
export async function checkCanCreateDocument(): Promise<DocumentUsageResult> {
  try {
    const response = await fetch('/api/subscription/usage-info')
    
    if (response.ok) {
      const usageInfo = await response.json()
      
      const documentUsage = usageInfo?.documents
      if (!documentUsage) {
        // If no document usage info, allow creation (graceful degradation)
        return { allowed: true, limit: 'unlimited', used: 0 }
      }
      
      return {
        allowed: documentUsage.allowed,
        limit: documentUsage.limit,
        used: documentUsage.used,
        remaining: documentUsage.remaining,
        message: documentUsage.allowed 
          ? undefined
          : `You've reached your document limit of ${documentUsage.limit}. Upgrade your plan to create more documents.`
      }
    }
    
    // If API call fails, allow the action (graceful degradation)
    console.warn('Could not fetch document usage info, allowing document creation')
    return { allowed: true, limit: 'unlimited', used: 0 }
  } catch (error) {
    console.warn('Error checking document usage limit, allowing document creation:', error)
    return { allowed: true, limit: 'unlimited', used: 0 }
  }
}

/**
 * Get current document usage statistics for display purposes
 */
export async function getDocumentUsageStats(): Promise<DocumentUsageResult> {
  try {
    const response = await fetch('/api/subscription/usage-info')
    
    if (response.ok) {
      const usageInfo = await response.json()
      const documentUsage = usageInfo?.documents
      
      if (!documentUsage) {
        return { allowed: true, limit: 'unlimited', used: 0 }
      }
      
      return {
        allowed: documentUsage.allowed,
        limit: documentUsage.limit,
        used: documentUsage.used,
        remaining: documentUsage.remaining
      }
    }
    
    return { allowed: true, limit: 'unlimited', used: 0 }
  } catch (error) {
    console.error('Error fetching document usage stats:', error)
    return { allowed: true, limit: 'unlimited', used: 0 }
  }
}

/**
 * Helper function to format usage limits for display
 */
export function formatDocumentUsage(usage: DocumentUsageResult): string {
  if (usage.limit === 'unlimited') {
    return `${usage.used} documents created`
  }
  
  return `${usage.used} / ${usage.limit} documents used`
}

/**
 * Check if user is approaching their document limit (80% or more)
 */
export function isApproachingDocumentLimit(usage: DocumentUsageResult): boolean {
  if (usage.limit === 'unlimited') return false
  
  const percentage = (usage.used / (usage.limit as number)) * 100
  return percentage >= 80
}

/**
 * Get usage percentage for progress indicators
 */
export function getDocumentUsagePercentage(usage: DocumentUsageResult): number {
  if (usage.limit === 'unlimited') return 0
  
  return Math.min((usage.used / (usage.limit as number)) * 100, 100)
} 