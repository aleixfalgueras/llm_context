import { auth } from '@clerk/nextjs/server'
import { AssistantLandingClient } from '@/components/assistant/assistant-landing-client'
import { NavbarWrapper } from '@/components/global/navbar-wrapper'
import { getClients } from '@/app/actions/client-action'
import { getChats } from '@/app/actions/chat-action'

export default async function AssistantPage() {
  const { userId } = await auth()

  // Get user's chats and clients
  const [chats, clients] = await Promise.all([
    getChats(),
    getClients({ includeDetails: true })
  ])

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <NavbarWrapper />
      <div className="flex-1 overflow-hidden">
        <AssistantLandingClient chats={chats} clients={clients} />
      </div>
    </div>
  )
} 