'use client'

import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from '@/lib/translations/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useState } from 'react'

export function LandingNavbar() {
  const t = useTranslations()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Navigation */}
      <nav className="pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo Only */}
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image
                  src="/mia_logo.svg"
                  alt="MIA"
                  width={200}
                  height={200}
                  className="w-[100px] h-[100px] md:w-[200px] md:h-[200px] transition-transform hover:scale-105"
                />
              </Link>
            </div>

            {/* Right: Nav Items, Language, Theme, Sign In */}
            <div className="flex items-center gap-6">
              {/* Desktop Nav Items */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="/ecosystem" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-base font-semibold text-gray-100 hover:border-gray-500 hover:text-gray-100 transition-colors h-9">
                  Ecosystem
                </Link>
                <button className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-base font-semibold text-gray-100 hover:border-gray-500 hover:text-gray-100 transition-colors h-9">
                  Membership
                </button>
                <Link href="/public-deals" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-base font-semibold text-gray-100 hover:border-gray-500 hover:text-gray-100 transition-colors h-9">
                  Promo & Deals
                </Link>
                <Link href="/awards" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-base font-semibold text-gray-100 hover:border-gray-500 hover:text-gray-100 transition-colors h-9">
                  Awards
                </Link>
              </div>

              <div className="hidden md:flex items-center gap-4">
                <LanguageSwitcher />
                <Button asChild className="bg-cian hover:bg-cian/90 text-white shadow-md text-base">
                  <Link href="/sign-in">{t('navigation.signIn')}</Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-700">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link href="/ecosystem" className="block w-full text-left px-3 py-2 rounded-md text-lg font-semibold text-gray-100 hover:text-gray-100 hover:bg-gray-700 transition-colors">
              Ecosystem
            </Link>
            <button className="block w-full text-left px-3 py-2 rounded-md text-lg font-semibold text-gray-100 hover:text-gray-100 hover:bg-gray-700 transition-colors">
              Membership
            </button>
            <Link href="/public-deals" className="block w-full text-left px-3 py-2 rounded-md text-lg font-semibold text-gray-100 hover:text-gray-100 hover:bg-gray-700 transition-colors">
              Promo & Deals
            </Link>
            <Link href="/awards" className="block w-full text-left px-3 py-2 rounded-md text-lg font-semibold text-gray-100 hover:text-gray-100 hover:bg-gray-700 transition-colors">
              Awards
            </Link>
          </div>
          <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between gap-4">
            <LanguageSwitcher />
            <Button asChild className="bg-cian hover:bg-cian/90 text-white shadow-md text-lg">
              <Link href="/sign-in">{t('navigation.signIn')}</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
