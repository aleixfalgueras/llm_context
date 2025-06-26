import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { HomePageClient } from '@/components/global/home-page-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/lib/client-actions'

export default async function AssistantPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
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
    getClients({ includeDetails: true })
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