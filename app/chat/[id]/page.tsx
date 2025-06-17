import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ChatSidebar } from '@/components/chat-sidebar'
import { ChatContainer } from '@/components/chat-container'

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
    <div className="flex h-screen">
      <ChatSidebar chats={chats} />
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          <h1 className="font-semibold text-lg">{chat.title}</h1>
        </div>

        {/* Chat Container with Messages and Input */}
        <ChatContainer 
          chatId={chat.id} 
          initialMessages={chat.messages}
          userImageUrl={user?.imageUrl}
          userName={user?.firstName || 'User'}
        />
      </div>
    </div>
  )
} 