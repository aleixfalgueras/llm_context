import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonNavbar() {
  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {/* Logo skeleton */}
              <Skeleton className="h-[70px] w-[70px] rounded-md" />
              
              {/* Desktop Navigation skeleton */}
              <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="flex items-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side skeleton */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              {/* Language switcher skeleton */}
              <Skeleton className="h-9 w-9 rounded-md" />
              {/* Theme toggle skeleton */}
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
            
            <div className="flex items-center space-x-2 pl-4 border-l border-border">
              {/* Menu button skeleton */}
              <Skeleton className="hidden lg:block h-8 w-8 rounded-md" />
              {/* User button skeleton */}
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}