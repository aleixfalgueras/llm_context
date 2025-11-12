'use client'

import { useTranslations } from '@/lib/translations/context'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingBackground } from '@/components/landing/landing-background'

export function AwardsPageClient() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <LandingBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        <LandingNavbar />

        {/* Main Content - Centered Vertically */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center space-y-5 px-6">
            {/* MIA */}
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-100">
              {t('awards.mia')}
            </h1>

            {/* PRESENTS */}
            <p className="text-2xl sm:text-3xl font-semibold text-gray-400 tracking-widest">
              {t('awards.presents')}
            </p>

            {/* INFLUENCER AWARDS */}
            <h2 className="text-4xl sm:text-5xl font-bold text-lavanda">
              {t('awards.title')}
            </h2>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto">
              {t('awards.subtitle')}
            </p>

            {/* Date */}
            <p className="text-2xl sm:text-3xl font-bold text-gray-100">
              {t('awards.date')}
            </p>

            {/* Coming soon! */}
            <p className="text-lg sm:text-xl font-bold bg-logo-gradient text-white px-6 py-3 rounded-full inline-block">
              {t('awards.comingSoon')}
            </p>
          </div>
        </div>

        <LandingFooter />
      </div>
    </div>
  )
}
