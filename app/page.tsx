import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatInterface } from '@/components/chat-interface'
import { LandingPage } from '@/components/landing-page'

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

  return (
    <div className="flex h-screen">
      <ChatSidebar chats={chats} />
      <div className="flex-1 flex items-center justify-center">
        <ChatInterface />
      </div>
    </div>
  )
}
