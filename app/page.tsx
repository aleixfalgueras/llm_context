import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "MIA",
  description: "Discover MIA, the ultimate AI-powered content platform designed for influencers and content creators. Streamline your workflow with intelligent campaign planning, automated content generation, and smart client management tools.",
  keywords: ["AI content assistant", "influencer content platform", "content creation tools", "AI campaign planner", "content automation", "social media content generator", "influencer CRM", "AI copywriting"],
  openGraph: {
    title: "MIA",
    description: "Join thousands of influencers using MIA to create compelling campaigns, generate engaging content, and manage clients effortlessly with AI-powered tools.",
    url: "https://mia.community/",
    type: "website",
    images: [
      {
        url: "/mia_logo.svg",
        width: 1200,
        height: 630,
        alt: "MIA - Millennials Influencers Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIA",
    description: "Join thousands of influencers using MIA to create compelling campaigns and generate engaging content with AI.",
    images: ["/mia_logo.svg"],
  },
  alternates: {
    canonical: "/",
  },
}

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return <LandingPage />
  }

  // Redirect authenticated users to the clients page as default
  redirect('/clients')
}
