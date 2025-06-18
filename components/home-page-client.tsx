'use client'

import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatInterface } from './chat-interface'
import { ClientSidebar } from './notes-sidebar'

interface HomePageClientProps {
  chats: any[]
  clients: any[]
}

export function HomePageClient({ chats, clients }: HomePageClientProps) {
  const [clientSidebarOpen, setClientSidebarOpen] = useState(true)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar 
        chats={chats}
        currentChatId={undefined}
        clientSidebarOpen={clientSidebarOpen}
        onClientSidebarToggle={() => setClientSidebarOpen(!clientSidebarOpen)}
        selectedClientId={selectedClient}
      />
      <div className="flex-1 flex items-center justify-center min-w-0">
        <ChatInterface />
      </div>
      
      {/* Client Sidebar */}
      <ClientSidebar 
        isOpen={clientSidebarOpen} 
        onToggle={() => setClientSidebarOpen(!clientSidebarOpen)}
        clients={clients}
        selectedClientId={selectedClient}
        onClientSelect={setSelectedClient}
        chatHasStarted={false}
      />
    </div>
  )
} 