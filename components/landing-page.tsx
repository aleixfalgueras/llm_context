'use client'

import {
  BarChart3,
  Bot,
  CheckIcon,
  CrownIcon,
  Megaphone,
  PenTool,
  Shield,
  Sparkles,
  StarIcon,
  Tag,
  Target,
  ZapIcon
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {AnimatedLogo} from '@/components/ui/animated-logo'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {ThemeToggle} from '@/components/global/theme-toggle'
import {getPlanNameColor} from '@/lib/utils/subscription-client-utils'
import {getAnnualSavings, SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'
import Link from 'next/link'
import {BillingInterval, SubscriptionPlan} from "@prisma/client";
import {useTranslations} from '@/lib/translations/context'
import {LanguageSwitcher} from '@/components/language-switcher'
import {useEffect, useState} from 'react'
import {useAuth} from '@clerk/nextjs'
import {useRouter} from 'next/navigation'

export function LandingPage() {
  const t = useTranslations()
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(BillingInterval.monthly)
  const {isSignedIn, isLoaded} = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/clients')
    }
  }, [isLoaded, isSignedIn, router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center">
          {/* Logo space can be used for icon or kept empty */}
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">{t('navigation.signIn')}</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          {/* Logo - Centered with Animation */}
          <div className="mb-8 flex justify-center">
            <AnimatedLogo
              src="/mia_logo.svg" 
              alt="MIA - Millennials Influencers Assistant" 
              width={350}
              height={350}
              className="max-w-xs md:max-w-sm"
              delay={50}
            />
          </div>

          <p className="text-xl text-gray-800 dark:text-gray-300 max-w-xl mx-auto mb-8">
            {t('landing.hero.tagline')}
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.features.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.clientIntelligence.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('landing.features.clientIntelligence.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.campaignStrategy.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('landing.features.campaignStrategy.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-purple-200 dark:hover:border-purple-800">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.contentCreation.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('landing.features.contentCreation.description')}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-orange-200 dark:hover:border-orange-800">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('landing.features.clientReporting.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('landing.features.clientReporting.description')}
              </p>
            </Card>
          </div>
        </div>
        
        {/* AI Models Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('landing.models.latestTechnology')}
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('landing.models.title')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Gemini 2.5 PRO */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                PREMIUM
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg font-bold">{t('landing.models.geminiPro.name')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('landing.models.geminiPro.description')}
                </p>
              </CardContent>
            </Card>

            {/* ChatGPT 5 */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                FLAGSHIP
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg font-bold">{t('landing.models.chatgpt5.name')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('landing.models.chatgpt5.description')}
                </p>
              </CardContent>
            </Card>

            {/* Perplexity Sonar */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                REASONING
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg font-bold">{t('landing.models.perplexity.name')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('landing.models.perplexity.description')}
                </p>
              </CardContent>
            </Card>

            {/* Gemini 2.5 Image */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                VISUAL AI
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PenTool className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-lg font-bold">{t('landing.models.geminiImage.name')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('landing.models.geminiImage.description')}
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
        
        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.howItWorks.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('landing.howItWorks.step1.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('landing.howItWorks.step1.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('landing.howItWorks.step2.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('landing.howItWorks.step2.description')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('landing.howItWorks.step3.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('landing.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-10 border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{t('landing.stats.targeted.title')}</div>
              <div className="text-gray-600 dark:text-gray-400">{t('landing.stats.targeted.subtitle')}</div>
              <div className="text-sm text-gray-500">{t('landing.stats.targeted.description')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{t('landing.stats.scalable.title')}</div>
              <div className="text-gray-600 dark:text-gray-400">{t('landing.stats.scalable.subtitle')}</div>
              <div className="text-sm text-gray-500">{t('landing.stats.scalable.description')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{t('landing.stats.strategic.title')}</div>
              <div className="text-gray-600 dark:text-gray-400">{t('landing.stats.strategic.subtitle')}</div>
              <div className="text-sm text-gray-500">{t('landing.stats.strategic.description')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{t('landing.stats.professional.title')}</div>
              <div className="text-gray-600 dark:text-gray-400">{t('landing.stats.professional.subtitle')}</div>
              <div className="text-sm text-gray-500">{t('landing.stats.professional.description')}</div>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {t('landing.security.badge')}
            </span>
          </div>
        </div>

        {/* Public Deals Banner */}
        <div className="mb-16">
          <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Tag className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {t('landing.publicDeals.title')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
                      {t('landing.publicDeals.description')}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/public-deals">
                    {t('landing.publicDeals.button')}
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('landing.pricing.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.pricing.description')}
            </p>
          </div>
          
          {/* Billing Interval Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setBillingInterval(BillingInterval.monthly)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === BillingInterval.monthly
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                onClick={() => setBillingInterval(BillingInterval.annual)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === BillingInterval.annual
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {t('landing.pricing.annual')}
                <span className="ml-1 text-xs text-green-600 dark:text-green-400">-20%</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {Object.entries(SUBSCRIPTION_PLAN_DETAIL).map(([planId, plan]) => {
              const getPlanIcon = (planId: string) => {
                switch (planId) {
                  case SubscriptionPlan.apprentice: return <ZapIcon className="h-6 w-6" />
                  case SubscriptionPlan.knight: return <Shield className="h-6 w-6" />
                  case SubscriptionPlan.master: return <StarIcon className="h-6 w-6" />
                  case SubscriptionPlan.jedi: return <CrownIcon className="h-6 w-6" />
                  default: return <ZapIcon className="h-6 w-6" />
                }
              }
              
              return (
                <Card key={planId} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      {getPlanIcon(planId)}
                    </div>
                    <CardTitle className={`text-xl font-bold ${getPlanNameColor(planId)}`}>{plan.name}</CardTitle>
                    <CardDescription className="text-sm min-h-[3rem] flex items-center justify-center">{t(plan.description)}</CardDescription>
                    <div className="mt-4 pt-2 pb-2 flex flex-col items-center justify-center min-h-[5rem]">
                      <div className="flex items-end">
                        <span className="text-3xl font-bold leading-none">
                          {billingInterval === BillingInterval.annual && plan.priceAnnual 
                            ? plan.priceAnnual 
                            : plan.price}€
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500 mb-1">
                            {billingInterval === BillingInterval.annual 
                              ? t('landing.pricing.perYear') 
                              : t('landing.pricing.perMonth')}
                          </span>
                        )}
                      </div>
                      {billingInterval === BillingInterval.annual && plan.priceAnnual && plan.price > 0 && (
                        <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                          {t('landing.pricing.savings')} {getAnnualSavings(planId as SubscriptionPlan)}€
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col flex-grow">
                    <ul className="space-y-2 flex-grow">
                      {plan.features_list.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{t(feature)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 text-center">{t('landing.cta.title')}</h3>
            <p className="text-gray-700 dark:text-gray-300 text-center max-w-lg">
              {t('landing.cta.description')}
            </p>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('landing.cta.businessInquiries')} <Link href="mailto:a.nelson@dreamotion.io" className="text-blue-600 dark:text-blue-400 hover:underline">a.nelson@dreamotion.io</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; {t('app.copyright')}</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-4">
                {t('navigation.termsOfService')}
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-4">
                {t('navigation.privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}