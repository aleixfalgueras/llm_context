import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { LandingPage } from '@/components/landing-page'
import { HomePageClient } from '@/components/home-page-client'
import { Navbar } from '@/components/navbar'
import { getClients } from '@/lib/client-actions'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return <LandingPage />
  }

  // Get user's chats and clients
  const [chats, clients] = await Promise.all([
    prisma.chat.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    getClients()
  ])

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <HomePageClient chats={chats} clients={clients} />
      </div>
    </div>
  )
}
