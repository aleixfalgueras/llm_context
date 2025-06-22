import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatPageClient } from '@/components/chat-page-client'
import { Navbar } from '@/components/navbar'
import { getClients } from '@/lib/client-actions'

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await auth()
  const { id } = await params

  if (!userId) {
    redirect('/sign-in')
  }

  // Get current user data from Clerk
  const user = await currentUser()

  // Get the specific chat and verify ownership, all user's chats, and clients in parallel
  const [chat, chats, clients] = await Promise.all([
    prisma.chat.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    }) as any,
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

  if (!chat) {
    notFound()
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <ChatPageClient
          chat={chat}
          chats={chats}
          clients={clients}
          userImageUrl={user?.imageUrl}
          userName={user?.firstName || 'User'}
        />
      </div>
    </div>
  )
} 