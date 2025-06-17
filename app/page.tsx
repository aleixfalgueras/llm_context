import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { LandingPage } from '@/components/landing-page'
import { HomePageClient } from '@/components/home-page-client'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return <LandingPage />
  }

  // Get user's chats
  const chats = await prisma.chat.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return <HomePageClient chats={chats} />
}
