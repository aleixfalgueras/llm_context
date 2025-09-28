'use client'

import Link from 'next/link'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import {UserButton, useUser} from '@clerk/nextjs'
import {ThemeToggle} from '@/components/global/theme-toggle'
import {cn} from '@/lib/utils/general'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator} from '@/components/ui/dropdown-menu'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger, NavigationMenuContent} from '@/components/ui/navigation-menu'
import {Menu} from 'lucide-react'
import {useMemo, useState} from 'react'
import {useTranslations} from '@/lib/translations/context'
import {LanguageSwitcher} from '@/components/language-switcher'
import {Button} from '@/components/ui/button'
import {ADMIN_EMAILS} from '@/lib/config'

export function Navbar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const t = useTranslations('navigation')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check if current user is admin (only after user is loaded)
  const userEmail = isLoaded ? user?.emailAddresses[0]?.emailAddress : undefined
  const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail) : false

  const navigation = useMemo(() => [
    { name: t('clients'), href: '/clients', icon: '👥' },
    { name: t('prompts'), href: '/prompts', icon: '📝' },
    { name: t('assistant'), href: '/assistant', icon: '🤖' },
    { name: t('aiServices'), href: '/ai-services', icon: '⚡' },
  ], [t])

  const networkSubmenu = useMemo(() => [
    { name: t('affiliation'), href: '/affiliation' },
  ], [t])

  // Helper function to determine if a nav item is active
  const isActive = (href: string) => {
    if (href === '/assistant') {
      // AI Assistant is active for assistant page and all chat pages
      return pathname === '/assistant' || pathname.startsWith('/assistant/chat/')
    }
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname === href
  }

  // Helper to check if Network dropdown should be active
  const isNetworkActive = () => pathname.startsWith('/affiliation')

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/mia_logo.svg"
                  alt="MIA"
                  width={70}
                  height={70}
                  className="mr-2"
                />
              </Link>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {navigation.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "cursor-pointer flex items-center w-full",
                            isActive(item.href) && "bg-accent"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="mr-2">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className={cn(
                            "cursor-pointer flex items-center w-full",
                            isActive('/admin') && "bg-accent"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="mr-2">🛡️</span>
                          <span>{t('admin')}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/subscription"
                        className="cursor-pointer flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{t('subscription')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/feedback"
                        className="cursor-pointer flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{t('feedback')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/privacy"
                        className="cursor-pointer flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{t('privacyPolicy')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/terms"
                        className="cursor-pointer flex items-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{t('termsOfService')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Navigation links */}
              <div className="hidden lg:ml-6 lg:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    {navigation.map((item) => (
                      <NavigationMenuItem key={item.name}>
                        <Link href={item.href} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              "ml-2.5 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors h-9",
                              isActive(item.href)
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                            )}
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.name}
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    ))}

                    {/* Network dropdown menu */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={cn(
                          "mt-2.5 ml-2 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors h-9",
                          isNetworkActive()
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                        )}
                      >
                        <span className="mr-2">🔗</span>
                        {t('network')}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="w-48 p-2">
                          {networkSubmenu.map((item) => (
                            <li key={item.name}>
                              <Link href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink
                                  className={cn(
                                    "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                    isActive(item.href) && "bg-accent"
                                  )}
                                >
                                  {item.name}
                                </NavigationMenuLink>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Admin link */}
                    {isAdmin && (
                      <NavigationMenuItem>
                        <Link href="/admin" legacyBehavior passHref>
                          <NavigationMenuLink
                            className={cn(
                              "ml-2 inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors h-9",
                              isActive('/admin')
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground"
                            )}
                          >
                            <span className="mr-2">🛡️</span>
                            {t('admin')}
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    )}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            <div className="flex items-center space-x-2 pl-4 border-l border-border">
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger className="hidden lg:inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('menu')}</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="cursor-pointer flex items-center">
                        <span>{t('subscription')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/feedback" className="cursor-pointer flex items-center">
                        <span>{t('feedback')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/privacy" className="cursor-pointer flex items-center">
                        <span>{t('privacyPolicy')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/terms" className="cursor-pointer flex items-center">
                        <span>{t('termsOfService')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 hover:scale-105 transition-transform",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 