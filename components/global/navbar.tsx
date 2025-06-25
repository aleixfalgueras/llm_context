'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/global/theme-toggle'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Menu } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Prompts', href: '/prompts', icon: '📝' },
    { name: 'AI Assistant', href: '/assistant', icon: '🤖' },
    { name: 'AI Services', href: '/ai-services', icon: '⚡' },
  ]

  // Helper function to determine if a nav item is active
  const isActive = (href: string) => {
    if (href === '/assistant') {
      // AI Assistant is active for assistant page and all chat pages
      return pathname === '/assistant' || pathname.startsWith('/assistant/chat/')
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
              <Link href="/" className="flex items-center">
                <h1 className="text-xl font-bold">AI Marketing Assistant</h1>
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
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <ThemeToggle />
            </div>
            
            <div className="flex items-center space-x-2 pl-4 border-l border-border">
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Menu</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="cursor-pointer flex items-center">
                        <span>Pricing</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/privacy" className="cursor-pointer flex items-center">
                        <span>Privacy Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/terms" className="cursor-pointer flex items-center">
                        <span>Terms of Service</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/privacy/cookies" className="cursor-pointer flex items-center">
                        <span>Cookie Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/feedback" className="cursor-pointer flex items-center">
                        <span>Provide Feedback</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
              
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 hover:scale-105 transition-transform"
                  }
                }}
              />
            </div>
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