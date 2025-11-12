'use client'

import { useTranslations } from '@/lib/translations/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingBackground } from '@/components/landing/landing-background'

export function EcosystemPageClient() {
  const t = useTranslations()

  const cards = [
    {
      key: 'aiAggregator',
      features: ['contentGeneration', 'marketAnalysis', 'automatedWorkflows'],
    },
    {
      key: 'hostingWebsite',
      features: ['globalCdn', 'collaborativeWorkspaces', 'workFromAnywhere'],
    },
    {
      key: 'cryptoDex',
      features: ['tokenLaunchpad', 'multiChainDex', 'secureTrading'],
    },
    {
      key: 'globalEvents',
      features: ['mastermindGroups', 'vipNetworking', 'industryEvents'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <LandingBackground />

      {/* Content Layer */}
      <div className="relative z-10">
        <LandingNavbar />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
          {/* Presentation Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-100">
              {t('ecosystem.headerPart1')}
              <span className="text-lavanda">{t('ecosystem.headerPart2')}</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {t('ecosystem.presentationText')}
            </p>
            <div className="pt-4">
              <h2 className="text-3xl font-semibold text-gray-100 mb-4">
                {t('ecosystem.subheader')}
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                {t('ecosystem.subheaderText')}
              </p>
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {cards.map((card) => (
              <Card
                key={card.key}
                className="bg-gray-800/60 border-cian
                hover:shadow-lg hover:shadow-lavanda/20 transition-all duration-300"
              >
                <CardHeader>
                  <CardTitle className="text-center text-xl text-gray-100 min-h-[4rem] flex items-center justify-center">
                    {t(`ecosystem.cards.${card.key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {card.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-gray-300"
                      >
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{t(`ecosystem.cards.${card.key}.features.${feature}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-semibold text-gray-100">
              {t('ecosystem.cta.subheader')}
            </h2>
            <Button className="bg-logo-gradient hover:brightness-110 text-white font-semibold shadow-lg hover:shadow-2xl hover:shadow-lavanda/50 transition-all duration-300 ease-out text-lg px-6 py-4 h-auto">
              {t('ecosystem.cta.button')}
            </Button>
          </div>
        </div>

        <LandingFooter />
      </div>
    </div>
  )
}
