import { prisma } from './prisma'

export interface ConsentData {
  dataProcessing: boolean
  analytics: boolean
  marketing: boolean
  agreedToTerms: boolean
  agreedToPrivacy: boolean
  termsVersion?: string
  privacyVersion?: string
  cookiesAnalytics: boolean
  cookiesMarketing: boolean
  cookiesFunctional: boolean
}

export interface ConsentMetadata {
  ipAddress?: string
  userAgent?: string
  consentMethod?: string
}

// Get user's current consent status
export async function getUserConsent(userId: string) {
  try {
    const consent = await prisma.userConsent.findUnique({
      where: { userId },
      select: {
        id: true,
        dataProcessing: true,
        analytics: true,
        marketing: true,
        agreedToTerms: true,
        agreedToPrivacy: true,
        termsVersion: true,
        privacyVersion: true,
        cookiesNecessary: true,
        cookiesAnalytics: true,
        cookiesMarketing: true,
        cookiesFunctional: true,
        consentGivenAt: true,
        lastUpdatedAt: true,
        withdrawnAt: true,
      }
    })

    return consent
  } catch (error) {
    console.error('Error fetching user consent:', error)
    return null
  }
}

// Save user consent preferences
export async function saveUserConsent(
  userId: string, 
  consentData: ConsentData, 
  metadata: ConsentMetadata = {}
) {
  try {
    // Validate required consents
    if (!consentData.dataProcessing || !consentData.agreedToTerms || !consentData.agreedToPrivacy) {
      throw new Error('Data processing consent and legal agreements are required')
    }

    // Get existing consent for audit trail
    const existingConsent = await getUserConsent(userId)

    // Create or update consent record
    const consent = await prisma.userConsent.upsert({
      where: { userId },
      create: {
        userId,
        dataProcessing: consentData.dataProcessing,
        analytics: consentData.analytics,
        marketing: consentData.marketing,
        agreedToTerms: consentData.agreedToTerms,
        agreedToPrivacy: consentData.agreedToPrivacy,
        termsVersion: consentData.termsVersion || '1.0',
        privacyVersion: consentData.privacyVersion || '1.0',
        cookiesNecessary: true, // Always true
        cookiesAnalytics: consentData.cookiesAnalytics,
        cookiesMarketing: consentData.cookiesMarketing,
        cookiesFunctional: consentData.cookiesFunctional,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        consentMethod: metadata.consentMethod || 'web_form',
      },
      update: {
        dataProcessing: consentData.dataProcessing,
        analytics: consentData.analytics,
        marketing: consentData.marketing,
        agreedToTerms: consentData.agreedToTerms,
        agreedToPrivacy: consentData.agreedToPrivacy,
        termsVersion: consentData.termsVersion || existingConsent?.termsVersion || '1.0',
        privacyVersion: consentData.privacyVersion || existingConsent?.privacyVersion || '1.0',
        cookiesAnalytics: consentData.cookiesAnalytics,
        cookiesMarketing: consentData.cookiesMarketing,
        cookiesFunctional: consentData.cookiesFunctional,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        consentMethod: metadata.consentMethod || 'web_form',
        withdrawnAt: null, // Reset withdrawal if user provides consent again
      }
    })

    // Create audit log for changes
    await createConsentAuditLog(userId, consentData, existingConsent, metadata)

    return consent
  } catch (error) {
    console.error('Error saving user consent:', error)
    throw error
  }
}

// Create audit log entries for consent changes
async function createConsentAuditLog(
  userId: string,
  newConsent: ConsentData,
  existingConsent: any,
  metadata: ConsentMetadata
) {
  const auditLogs = []

  if (!existingConsent) {
    // New consent record
    auditLogs.push({
      userId,
      action: 'granted',
      consentType: 'initial_consent',
      previousValue: null,
      newValue: true,
      reason: 'user_registration',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    })
  } else {
    // Check for changes and log them
    const changes = [
      { field: 'dataProcessing', type: 'data_processing', newValue: newConsent.dataProcessing },
      { field: 'analytics', type: 'analytics', newValue: newConsent.analytics },
      { field: 'marketing', type: 'marketing', newValue: newConsent.marketing },
      { field: 'cookiesAnalytics', type: 'cookies_analytics', newValue: newConsent.cookiesAnalytics },
      { field: 'cookiesMarketing', type: 'cookies_marketing', newValue: newConsent.cookiesMarketing },
      { field: 'cookiesFunctional', type: 'cookies_functional', newValue: newConsent.cookiesFunctional },
    ]

    for (const change of changes) {
      const oldValue = existingConsent[change.field] as boolean
      const newValue = change.newValue
      
      if (oldValue !== newValue) {
        auditLogs.push({
          userId,
          action: newValue ? 'granted' : 'withdrawn',
          consentType: change.type,
          previousValue: oldValue,
          newValue,
          reason: 'user_request',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        })
      }
    }
  }

  // Create audit log entries
  if (auditLogs.length > 0) {
    await prisma.consentAuditLog.createMany({
      data: auditLogs
    })
  }
}

// Withdraw all consent (for account deletion)
export async function withdrawAllConsent(userId: string, reason: string = 'user_request', metadata: ConsentMetadata = {}) {
  try {
    // Update consent record to mark as withdrawn
    const consent = await prisma.userConsent.update({
      where: { userId },
      data: {
        dataProcessing: false,
        analytics: false,
        marketing: false,
        cookiesAnalytics: false,
        cookiesMarketing: false,
        cookiesFunctional: false,
        withdrawnAt: new Date(),
      }
    })

    // Create audit log entry
    await prisma.consentAuditLog.create({
      data: {
        userId,
        action: 'withdrawn',
        consentType: 'all_consent',
        previousValue: true,
        newValue: false,
        reason,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      }
    })

    return consent
  } catch (error) {
    console.error('Error withdrawing consent:', error)
    throw error
  }
}

// Check if user has given required consent
export async function hasRequiredConsent(userId: string): Promise<boolean> {
  try {
    const consent = await getUserConsent(userId)
    return !!(consent?.dataProcessing && consent?.agreedToTerms && consent?.agreedToPrivacy && !consent?.withdrawnAt)
  } catch (error) {
    console.error('Error checking required consent:', error)
    return false
  }
}

// Check specific consent type
export async function hasConsentFor(userId: string, consentType: 'analytics' | 'marketing' | 'cookiesAnalytics' | 'cookiesMarketing' | 'cookiesFunctional'): Promise<boolean> {
  try {
    const consent = await getUserConsent(userId)
    return !!(consent?.[consentType] && !consent?.withdrawnAt)
  } catch (error) {
    console.error(`Error checking ${consentType} consent:`, error)
    return false
  }
}

// Get consent audit log for a user
export async function getConsentAuditLog(userId: string, limit: number = 50) {
  try {
    const auditLog = await prisma.consentAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        consentType: true,
        previousValue: true,
        newValue: true,
        reason: true,
        createdAt: true,
      }
    })

    return auditLog
  } catch (error) {
    console.error('Error fetching consent audit log:', error)
    return []
  }
}

// Check if user has any pending deletion requests
export async function getPendingDeletionRequest(userId: string) {
  try {
    const pendingDeletion = await prisma.dataExportRequest.findFirst({
      where: {
        userId,
        requestType: 'account_deletion',
        status: 'pending',
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return pendingDeletion
  } catch (error) {
    console.error('Error fetching pending deletion request:', error)
    return null
  }
}

// Get all deletion requests for a user
export async function getDeletionRequestHistory(userId: string) {
  try {
    const deletionHistory = await prisma.dataExportRequest.findMany({
      where: {
        userId,
        requestType: 'account_deletion'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        status: true,
        requestData: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true
      }
    })

    return deletionHistory
  } catch (error) {
    console.error('Error fetching deletion request history:', error)
    return []
  }
} 