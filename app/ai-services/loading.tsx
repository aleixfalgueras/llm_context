import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          {/* Service cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border rounded-lg p-6 space-y-4">
                {/* Icon and title */}
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <Skeleton className="h-6 w-32" />
                </div>
                
                {/* Description */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                {/* Features list */}
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                
                {/* Action button */}
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonPageWrapper>
  )
}