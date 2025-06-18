'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatContainer } from './chat-container'
import { ClientSidebar } from './notes-sidebar'
import { getClients } from '@/lib/client-actions'

interface ChatPageClientProps {
  chat: {
    id: string
    title: string
    messages: any[]
    clientId: string
  }
  chats: any[]
  userImageUrl?: string
  userName: string
}

export function ChatPageClient({ chat, chats, userImageUrl, userName }: ChatPageClientProps) {
  const [clientSidebarOpen, setClientSidebarOpen] = useState(true)
  const [currentTitle, setCurrentTitle] = useState(chat.title)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch clients for sidebar
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const clientList = await getClients()
        setClients(clientList)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Get selected client info for context
  const selectedClient = clients.find(client => client.id === chat.clientId)

  return (
    <div className="flex h-full">
      <ChatSidebar 
        chats={chats}
        currentChatId={chat.id}
        clientSidebarOpen={clientSidebarOpen}
        onClientSidebarToggle={() => setClientSidebarOpen(!clientSidebarOpen)}
        selectedClientId={chat.clientId}
      />
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          <h1 className="font-semibold text-lg">{currentTitle}</h1>
          {selectedClient && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Chat with context for: {selectedClient.name}
            </p>
          )}
        </div>

        {/* Chat Container with Messages and Input */}
        <ChatContainer 
          chatId={chat.id} 
          initialMessages={chat.messages}
          userImageUrl={userImageUrl}
          userName={userName}
          selectedNoteContent={null}
          selectedNoteName={selectedClient?.name}
          onNoteContextSent={() => {}}
          onTitleUpdate={setCurrentTitle}
        />
      </div>
      
      {/* Client Sidebar */}
      <ClientSidebar 
        isOpen={clientSidebarOpen} 
        onToggle={() => setClientSidebarOpen(!clientSidebarOpen)}
        chatId={chat.id}
        selectedClientId={chat.clientId}
        clients={clients}
        chatHasStarted={true}
      />
    </div>
  )
} 