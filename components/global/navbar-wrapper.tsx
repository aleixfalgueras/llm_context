'use client'

import dynamic from 'next/dynamic'

// Dynamically import Navbar with no SSR to avoid hydration issues
export const NavbarWrapper = dynamic(
  () => import('./navbar').then(mod => ({ default: mod.Navbar })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-16" />
        </div>
      </div>
    )
  }
)