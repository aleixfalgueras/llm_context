import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { AssistantLandingClient } from '@/components/assistant/assistant-landing-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/lib/actions/client'

export default async function AssistantPage() {
  const { userId } = await auth()

  // Get user's chats and clients
  const [chats, clients] = await Promise.all([
    prisma.chat.findMany({
      where: {
        userId: userId!,
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
        <AssistantLandingClient chats={chats} clients={clients} />
      </div>
    </div>
  )
} 