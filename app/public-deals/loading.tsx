import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Top right controls skeleton */}
        <div className="flex justify-end items-center p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Language switcher */}
            <Skeleton className="h-10 w-10 rounded-md" /> {/* Theme toggle */}
            <Skeleton className="h-10 w-20 rounded-md" /> {/* Sign in button */}
          </div>
        </div>

        {/* Centered Header with Logo + Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Skeleton className="h-[180px] w-[180px] rounded-lg" /> {/* Logo */}
            <Skeleton className="h-14 w-48 ml-2" /> {/* Title */}
          </div>
          <Skeleton className="h-7 max-w-2xl mx-auto" /> {/* Subtitle */}
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Search bar skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Public Deals Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" /> {/* Icon */}
              <Skeleton className="h-7 w-48" /> {/* Section title */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="border rounded-lg overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2 pt-4">
                      <Skeleton className="h-9 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPageWrapper>
  )
}
