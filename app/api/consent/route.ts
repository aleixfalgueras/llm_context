import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserConsent, saveUserConsent, withdrawAllConsent, ConsentData } from '@/lib/consent-utils'

// Get user's current consent preferences
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const consent = await getUserConsent(userId)

    return NextResponse.json({
      consent: consent || {
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
    })
  } catch (error) {
    console.error('Error fetching consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create or update user consent preferences
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
    } = body

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

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

    return NextResponse.json({
      success: true,
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
    })
  } catch (error) {
    console.error('Error saving consent:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Withdraw consent (for account deletion or consent withdrawal)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { withdrawalReason = 'user_request' } = await request.json()

    // Get client IP and user agent for audit trail
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await withdrawAllConsent(userId, withdrawalReason, {
      ipAddress: clientIP,
      userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Consent withdrawn successfully'
    })
  } catch (error) {
    console.error('Error withdrawing consent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 