import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Public Deals Section */}
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="border rounded-lg p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Deals Section skeleton */}
        <div className="space-y-4 pt-8">
          <Skeleton className="h-7 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border rounded-lg p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonPageWrapper>
  )
}