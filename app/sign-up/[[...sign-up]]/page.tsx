import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignUp />
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