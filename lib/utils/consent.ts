import {prisma} from '../prisma'
import {ConsentAction, ConsentType} from '@/types/enums'
import {NextRequest} from "next/server";

// Current policy versions - update these when you change Terms/Privacy Policy
export const CURRENT_TERMS_VERSION = '1.0'
export const CURRENT_PRIVACY_VERSION = '1.0'

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
        termsVersion: consentData.termsVersion || CURRENT_TERMS_VERSION,
        privacyVersion: consentData.privacyVersion || CURRENT_PRIVACY_VERSION,
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
        termsVersion: consentData.termsVersion || CURRENT_TERMS_VERSION,
        privacyVersion: consentData.privacyVersion || CURRENT_PRIVACY_VERSION,
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
      action: ConsentAction.GRANTED,
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
      { field: 'dataProcessing', type: ConsentType.DATA_PROCESSING, newValue: newConsent.dataProcessing },
      { field: 'analytics', type: ConsentType.ANALYTICS, newValue: newConsent.analytics },
      { field: 'marketing', type: ConsentType.MARKETING, newValue: newConsent.marketing },
      { field: 'cookiesAnalytics', type: ConsentType.COOKIES_ANALYTICS, newValue: newConsent.cookiesAnalytics },
      { field: 'cookiesMarketing', type: ConsentType.COOKIES_MARKETING, newValue: newConsent.cookiesMarketing },
      { field: 'cookiesFunctional', type: ConsentType.COOKIES_FUNCTIONAL, newValue: newConsent.cookiesFunctional },
    ]

    for (const change of changes) {
      const oldValue = existingConsent[change.field] as boolean
      const newValue = change.newValue
      
      if (oldValue !== newValue) {
        auditLogs.push({
          userId,
          action: newValue ? ConsentAction.GRANTED : ConsentAction.WITHDRAWN,
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
        action: ConsentAction.WITHDRAWN,
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

// Check if user consent is current with latest policy versions
export async function hasCurrentConsent(userId: string): Promise<boolean> {
  try {
    const consent = await getUserConsent(userId)
    
    if (!consent || consent.withdrawnAt) {
      return false
    }

    // Check if user has agreed to current versions
    const hasCurrentTerms = consent.agreedToTerms && consent.termsVersion === CURRENT_TERMS_VERSION
    const hasCurrentPrivacy = consent.agreedToPrivacy && consent.privacyVersion === CURRENT_PRIVACY_VERSION
    const hasRequiredConsent = consent.dataProcessing

    return hasCurrentTerms && hasCurrentPrivacy && hasRequiredConsent
  } catch (error) {
    console.error('Error checking current consent:', error)
    return false
  }
}

/**
 * Extract client IP and user agent for audit trails
 * Eliminates duplicate code across routes that need this information
 */
export function extractClientInfo(req: NextRequest): {
  ipAddress: string;
  userAgent: string
} {
  const ipAddress = req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.ip ||
    'unknown'

  const userAgent = req.headers.get('user-agent') || 'unknown'

  return {ipAddress, userAgent}
}