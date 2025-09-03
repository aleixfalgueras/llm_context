import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPageWrapper } from '@/components/ui/skeleton-page-wrapper'

export default function Loading() {
  return (
    <SkeletonPageWrapper>
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          
          {/* Feedback form skeleton */}
          <div className="border rounded-lg p-6 space-y-6">
            {/* Category field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Subject field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Message field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-full" />
            </div>
            
            {/* Rating field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Skeleton key={star} className="h-8 w-8" />
                ))}
              </div>
            </div>
            
            {/* Submit button */}
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Previous feedback section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[1, 2].map((item) => (
                <div key={item} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Skeleton key={star} className="h-4 w-4" />
                    ))}
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