import { auth } from '@clerk/nextjs/server'
import { AssistantLandingClient } from '@/components/assistant/assistant-landing-client'
import { Navbar } from '@/components/global/navbar'
import { getClients } from '@/app/actions/client-action'
import { ChatService } from '@/services/chat-service'
import { isSuccess } from '@/database/base-operations'

export default async function AssistantPage() {
  const { userId } = await auth()

  // Get user's chats and clients
  const [chatsResult, clients] = await Promise.all([
    ChatService.getUserChats(userId!),
    getClients({ includeDetails: true })
  ])

  // Handle chats service result
  const chats = isSuccess(chatsResult) ? chatsResult.data : []

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <AssistantLandingClient chats={chats} clients={clients} />
      </div>
    </div>
  )
} 