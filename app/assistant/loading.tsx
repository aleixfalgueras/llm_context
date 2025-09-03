import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonNavbar } from '@/components/ui/skeleton-navbar'

export default function Loading() {
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <SkeletonNavbar />
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden relative">
          {/* Left Sidebar - Chats */}
          <div className="hidden wide:block flex-shrink-0 h-full w-64 border-r">
            <div className="p-4 space-y-4">
              {/* Chats header */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-12" />
              </div>
              
              {/* Delete All Chats button */}
              <Skeleton className="h-10 w-full" />
              
              {/* Chat list skeleton */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center Area - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-2xl w-full space-y-8">
                {/* Icon and Title */}
                <div className="text-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-12 w-80 mx-auto" />
                </div>
                
                {/* Get Started Card */}
                <div className="border rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                    <Skeleton className="h-5 w-96 mx-auto" />
                    <Skeleton className="h-10 w-32 mx-auto" />
                  </div>
                </div>
                
                {/* Privacy Protected Card */}
                <div className="border rounded-lg p-6">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-36" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full max-w-md mx-auto" />
                      <Skeleton className="h-4 w-3/4 max-w-md mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Client Information */}
          <div className="hidden wide:block flex-shrink-0 h-full w-80 border-l">
            <div className="p-4 space-y-4">
              {/* Client Information header */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-40" />
              </div>
              
              {/* Select Client section */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              {/* New Chat button */}
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}