import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          {/* Status cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          
          {/* Affiliation tree skeleton */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            
            {/* Tree structure skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((parent) => (
                <div key={parent} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="ml-6 space-y-2">
                    {[1, 2].map((child) => (
                      <div key={child} className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Commission info skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonPageWrapper>
  )
}