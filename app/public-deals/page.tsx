import { PublicDealsClient } from '@/components/deals/public-deals-client'
import { getPublicDeals } from '@/app/actions/deal-action'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingBackground } from '@/components/landing/landing-background'
import { LandingFooter } from '@/components/landing/landing-footer'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <LandingBackground />

      <div className="relative z-10">
        <LandingNavbar />

        {/* Main content */}
        <PublicDealsClient initialPublicDeals={publicDeals} />

        <LandingFooter />
      </div>
    </div>
  )
}
