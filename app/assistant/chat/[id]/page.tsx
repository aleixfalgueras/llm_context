import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatPageClient } from '@/components/assistant/chat-page-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/lib/client-actions'

interface ChatPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await auth()
  const { id } = await params

  // Get current user data from Clerk
  const user = await currentUser()

  // Get the specific chat and verify ownership, all user's chats, and clients in parallel
  const [chat, chats, clients] = await Promise.all([
    prisma.chat.findFirst({
      where: {
        id,
        userId: userId!,
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
        userId: userId!,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }),
    getClients({ includeDetails: true })
  ])

  if (!chat) {
    notFound()
  }

  // Find the last model used in this chat (from the most recent user message)
  const lastUserMessage = chat.messages
    .filter((msg: any) => msg.role === 'USER' && msg.model)
    .reverse()[0]
  
  // Only pass lastUsedModel if there are actual messages, otherwise let ChatInput use localStorage
  const lastUsedModel = lastUserMessage?.model

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
          lastUsedModel={lastUsedModel}
        />
      </div>
    </div>
  )
} 