import {currentUser} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {ChatPageClient} from '@/components/assistant/chat-page-client'
import {Navbar} from '@/components/global/navbar'
import {getClients} from '@/app/actions/client-action'
import {getChats} from '@/app/actions/chat-action'

interface NewChatPageProps {
  searchParams: Promise<{ clientId?: string; contextFields?: string }>
}

export default async function NewChatPage({ searchParams }: NewChatPageProps) {
  const { clientId, contextFields } = await searchParams

  // Get current user data from Clerk
  const user = await currentUser()

  // Get all user's chats and clients in parallel
  const [chats, clients] = await Promise.all([
    getChats(),
    getClients({ includeDetails: true })
  ])

  // Parse context fields
  let parsedContextFields: string[] = []
  if (contextFields) {
    try {
      parsedContextFields = JSON.parse(contextFields)
    } catch (error) {
      console.error('Failed to parse context fields:', error)
    }
  }

  // Create a mock chat object for new chat
  const newChat = {
    id: '', // Empty ID indicates new chat
    title: 'New Chat',
    messages: [],
    clientId: clientId || null,
    contextFields: parsedContextFields,
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <ChatPageClient
          chat={newChat}
          chats={chats}
          clients={clients}
          userImageUrl={user?.imageUrl}
          userName={user?.firstName || 'User'}
          isNewChat={true}
        />
      </div>
    </div>
  )
}