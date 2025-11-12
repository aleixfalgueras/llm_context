'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingBackground } from '@/components/landing/landing-background'

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <LandingBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        <LandingNavbar />

        {/* Generic skeleton content */}
        <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
          {/* Main content skeleton */}
          <div className="text-center space-y-6 mb-12">
            <Skeleton className="h-12 w-3/4 mx-auto bg-gray-700" />
            <Skeleton className="h-6 w-1/2 mx-auto bg-gray-700" />
            <div className="pt-4">
              <Skeleton className="h-10 w-1/3 mx-auto bg-gray-700" />
              <Skeleton className="h-6 w-2/3 mx-auto mt-4 bg-gray-700" />
            </div>
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
                <Skeleton className="h-7 w-3/4 mx-auto bg-gray-700" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full bg-gray-700" />
                  <Skeleton className="h-5 w-full bg-gray-700" />
                  <Skeleton className="h-5 w-full bg-gray-700" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA skeleton */}
          <div className="text-center space-y-6">
            <Skeleton className="h-10 w-1/2 mx-auto bg-gray-700" />
            <Skeleton className="h-12 w-64 mx-auto bg-gray-700" />
          </div>
        </div>

        <LandingFooter />
      </div>
    </div>
  )
}
