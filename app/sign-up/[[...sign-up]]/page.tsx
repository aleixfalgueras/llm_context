import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function Page({
  searchParams
}: {
  searchParams: { ref?: string }
}) {
  const referralCode = searchParams.ref
  
  // Pass referral code to Clerk's unsafeMetadata if it exists
  const unsafeMetadata = referralCode 
    ? { referralCode: referralCode.toUpperCase() }
    : undefined
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      {referralCode && (
        <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
          <p className="text-sm">
            Signing up with referral code: <strong>{referralCode.toUpperCase()}</strong>
          </p>
        </div>
      )}
      <SignUp 
        unsafeMetadata={unsafeMetadata}
      />
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