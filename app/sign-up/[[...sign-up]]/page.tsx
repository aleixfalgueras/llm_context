import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AffiliationOperations } from '@/database/affiliation-operations'

export default async function Page({
  searchParams
}: {
  searchParams: { ref?: string }
}) {
  const referralCode = searchParams.ref
  
  // Redirect to landing page if no referral code is provided
  if (!referralCode) {
    redirect('/')
  }
  
  let isValidReferralCode = true
  let validationError = ''
  
  // Validate referral code
  try {
    const result = await AffiliationOperations.findAffiliationByCode(referralCode.toUpperCase())
    if (!result.success || !result.data) {
      isValidReferralCode = false
      validationError = `Referral code "${referralCode.toUpperCase()}" was not found in our system`
    }
  } catch (error) {
    isValidReferralCode = false
    validationError = 'Unable to validate referral code. Please try again later.'
  }
  
  // Pass referral code to Clerk's unsafeMetadata only if valid
  const unsafeMetadata = isValidReferralCode
    ? { referralCode: referralCode.toUpperCase() }
    : undefined
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      {/* Invalid referral code message */}
      {!isValidReferralCode && (
        <div className="mb-6 max-w-md mx-auto">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {validationError}
            </p>
          </div>
        </div>
      )}
      
      {/* Valid referral code notification */}
      {isValidReferralCode && (
        <div className="my-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
          <p className="text-sm">
            Signing up with referral code: <strong>{referralCode.toUpperCase()}</strong>
          </p>
        </div>
      )}
      
      {/* Only show Clerk SignUp if valid referral code */}
      {isValidReferralCode && (
        <SignUp 
          unsafeMetadata={unsafeMetadata}
        />
      )}
      
      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>
        By signing up, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
        <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
          Privacy Policy
        </Link>
        </p>
        <p className="text-xs">
          You must be at least 18 years old to create an account.
        </p>
      </div>
    </div>
  )
} 