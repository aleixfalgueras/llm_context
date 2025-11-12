'use client'

import Link from 'next/link'
import { useTranslations } from '@/lib/translations/context'

export function LandingFooter() {
  const t = useTranslations()

  return (
    <footer className="border-t border-gray-700 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>&copy; {t('app.copyright')}</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="/terms" className="hover:text-gray-100 transition-colors underline underline-offset-4">
              {t('navigation.termsOfService')}
            </Link>
            <Link href="/privacy" className="hover:text-gray-100 transition-colors underline underline-offset-4">
              {t('navigation.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
