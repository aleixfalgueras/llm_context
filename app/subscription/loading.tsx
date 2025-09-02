import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="text-center space-y-2">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          {/* Current subscription status skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
            
            {/* Usage progress bar */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          
          {/* Plans grid skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((plan) => (
                <div key={plan} className="border rounded-lg p-6 space-y-4">
                  <div className="text-center space-y-2">
                    <Skeleton className="h-6 w-24 mx-auto" />
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                  
                  {/* Features list */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  
                  {/* Select button */}
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          
          {/* FAQ section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="border rounded-lg p-4">
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPageWrapper>
  )
}