import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatPageClient } from '@/components/chat-page-client'

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

  // Get the specific chat and verify ownership
  const chat = await prisma.chat.findFirst({
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
  })

  if (!chat) {
    notFound()
  }

  // Get all user's chats for the sidebar
  const chats = await prisma.chat.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return (
    <ChatPageClient
      chat={chat}
      chats={chats}
      userImageUrl={user?.imageUrl}
      userName={user?.firstName || 'User'}
    />
  )
} 