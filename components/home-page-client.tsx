'use client'

import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatInterface } from './chat-interface'
import { ClientContextSidebar } from './client-context-sidebar'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'

interface HomePageClientProps {
  chats: any[]
  clients: any[]
}

export function HomePageClient({ chats, clients }: HomePageClientProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clientContext, setClientContext] = useState<ClientContextSelection>(defaultClientContextSelections.general)

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar 
        chats={chats}
        hideNewChatButton={true}
      />
      <div className="flex-1 flex items-center justify-center min-w-0">
        <ChatInterface />
      </div>
      
      {/* Client Context Sidebar - Always visible */}
      <ClientContextSidebar 
        clients={clients}
        selectedClientId={selectedClient}
        onClientSelect={setSelectedClient}
        hasActiveChat={false}
        clientContext={clientContext}
        onClientContextChange={setClientContext}
      />
    </div>
  )
} 