import { SkeletonNavbar } from '@/components/ui/skeleton-navbar'
import { ReactNode } from 'react'

interface SkeletonPageWrapperProps {
  children: ReactNode
}

export function SkeletonPageWrapper({ children }: SkeletonPageWrapperProps) {
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <SkeletonNavbar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}