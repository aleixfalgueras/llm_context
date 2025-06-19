'use client'

import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatInterface } from './chat-interface'
import { ClientContextSidebar } from './client-context-sidebar'

interface HomePageClientProps {
  chats: any[]
  clients: any[]
}

export function HomePageClient({ chats, clients }: HomePageClientProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar 
        chats={chats}
        currentChatId={undefined}
        selectedClientId={selectedClient}
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
      />
    </div>
  )
} 