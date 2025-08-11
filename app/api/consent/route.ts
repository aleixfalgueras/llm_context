import {getUserConsent, saveUserConsent, withdrawAllConsent, ConsentData, extractClientInfo} from '@/lib/utils/consent'
import { withEnhancedApi, parseJsonBody, apiSuccess } from '@/lib/api/api-middleware'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// Get user's current consent preferences
export const GET = withEnhancedApi(async ({ userId }) => {
  const consent = await getUserConsent(userId)

  // Return consent data directly (not wrapped in 'consent' object)
  const consentData = consent || {
    dataProcessing: false,
    analytics: false,
    marketing: false,
    agreedToTerms: false,
    agreedToPrivacy: false,
    cookiesNecessary: true,
    cookiesAnalytics: false,
    cookiesMarketing: false,
    cookiesFunctional: false,
  }

  return apiSuccess(consentData)
}, {
  context: 'Get user consent preferences',
  allowedMethods: ['GET']
})

// Create or update user consent preferences
export const POST = withEnhancedApi(async ({ userId, req }) => {
  const {
    dataProcessing,
    analytics,
    marketing,
    agreedToTerms,
    agreedToPrivacy,
    termsVersion,
    privacyVersion,
    cookiesAnalytics,
    cookiesMarketing,
    cookiesFunctional,
  } = await parseJsonBody(req)

  // Get client IP and user agent for audit trail
  const { ipAddress: clientIP, userAgent } = extractClientInfo(req)

  const consentData: ConsentData = {
    dataProcessing: dataProcessing || false,
    analytics: analytics || false,
    marketing: marketing || false,
    agreedToTerms: agreedToTerms || false,
    agreedToPrivacy: agreedToPrivacy || false,
    termsVersion,
    privacyVersion,
    cookiesAnalytics: cookiesAnalytics || false,
    cookiesMarketing: cookiesMarketing || false,
    cookiesFunctional: cookiesFunctional || false,
  }

  const consent = await saveUserConsent(userId, consentData, {
    ipAddress: clientIP,
    userAgent,
    consentMethod: 'web_form'
  })

  return apiSuccess({
    consent: {
      id: consent.id,
      dataProcessing: consent.dataProcessing,
      analytics: consent.analytics,
      marketing: consent.marketing,
      agreedToTerms: consent.agreedToTerms,
      agreedToPrivacy: consent.agreedToPrivacy,
      cookiesAnalytics: consent.cookiesAnalytics,
      cookiesMarketing: consent.cookiesMarketing,
      cookiesFunctional: consent.cookiesFunctional,
      lastUpdatedAt: consent.lastUpdatedAt,
    }
  }, 201)
}, {
  context: 'Save user consent preferences',
  allowedMethods: ['POST'],
  expectedContentType: 'application/json'
})

// Withdraw consent (for account deletion or consent withdrawal)
export const DELETE = withEnhancedApi(async ({ userId, req }) => {
  const { withdrawalReason = 'user_request' } = await parseJsonBody(req)

  // Get client IP and user agent for audit trail
  const { ipAddress: clientIP, userAgent } = extractClientInfo(req)

  await withdrawAllConsent(userId, withdrawalReason, {
    ipAddress: clientIP,
    userAgent
  })

  return apiSuccess({
    message: 'Consent withdrawn successfully'
  })
}, {
  context: 'Withdraw user consent',
  allowedMethods: ['DELETE'],
  expectedContentType: 'application/json'
}) 