'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'AI Services', href: '/ai-services', icon: '⚡' },
    { name: 'AI Assistant', href: '/assistant', icon: '🤖' },
    { name: 'Feature Requests', href: '/feedback', icon: '💡' },
  ]

  // Helper function to determine if a nav item is active
  const isActive = (href: string) => {
    if (href === '/assistant') {
      // AI Assistant is active for assistant page and all chat pages
      return pathname === '/assistant' || pathname.startsWith('/chat/')
    }
    return pathname === href
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <div className="flex space-x-8">
              {/* Logo */}
              <Link href="/clients" className="flex items-center">
                <span className="text-xl font-bold text-primary">
                  HealthCoach AI
                </span>
              </Link>
              
              {/* Navigation links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                    )}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="space-y-1 pb-3 pt-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block border-l-4 py-2 pl-3 pr-4 text-base font-medium transition-colors",
                isActive(item.href)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:border-gray-300 hover:bg-gray-50 hover:text-foreground"
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 