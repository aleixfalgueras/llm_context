import { PublicDealsClient } from '@/components/deals/public-deals-client'
import { getPublicDeals } from '@/app/actions/deal-action'
import { ThemeToggle } from '@/components/global/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { getTranslations } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { auth } from '@clerk/nextjs/server'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Public Deals - MIA | Exclusive Community Offers",
  description: "Discover exclusive deals and offers from our community of influencers and content creators. Browse the latest deals shared by MIA members.",
  keywords: ["deals", "offers", "discounts", "community deals", "influencer deals", "exclusive offers", "content creator deals"],
  openGraph: {
    title: "Public Deals - MIA Community",
    description: "Browse exclusive deals and offers shared by influencers and content creators in the MIA community.",
    url: "https://mia.community/public-deals",
    type: "website",
    images: [
      {
        url: "/mia_logo.svg",
        width: 1200,
        height: 630,
        alt: "MIA - Public Deals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Public Deals - MIA Community",
    description: "Browse exclusive deals and offers shared by influencers and content creators.",
    images: ["/mia_logo.svg"],
  },
  alternates: {
    canonical: "/public-deals",
  },
}

export default async function PublicDealsPage() {
  const publicDeals = await getPublicDeals()
  const { userId } = await auth()
  const t = await getTranslations('deals')
  const tNav = await getTranslations('navigation')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Simple header with language and theme controls */}
      <div className="flex justify-end items-center p-6">
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          {!userId && (
            <Button variant="ghost" asChild>
              <Link href="/sign-in">{tNav('signIn')}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Centered Header with Logo + Deals text */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Link href="/">
            <Image
              src="/mia_logo.svg"
              alt="MIA - Millennials Influencers Assistant"
              width={180}
              height={180}
              className="hover:opacity-90 transition-opacity"
            />
          </Link>
          <h1 className="ml-2 text-5xl font-semibold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto px-4">
          {t('description')}
        </p>
      </div>

      {/* Main content */}
      <PublicDealsClient initialPublicDeals={publicDeals} />
    </div>
  )
}
