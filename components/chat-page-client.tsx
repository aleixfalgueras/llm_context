'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatContainer } from './chat-container'
import { ClientContextSidebar } from './client-context-sidebar'
import { getClients } from '@/lib/client-actions'

interface ChatPageClientProps {
  chat: {
    id: string
    title: string
    messages: any[]
    clientId: string
    contextFields?: string[]
  }
  chats: any[]
  userImageUrl?: string
  userName: string
}

export function ChatPageClient({ chat, chats, userImageUrl, userName }: ChatPageClientProps) {
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
        selectedClientId={chat.clientId}
      />
      <div className="flex-1 flex flex-col">
        {/* Enhanced Chat Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">{currentTitle}</h1>
            </div>
          </div>
        </div>

        {/* Chat Container with Messages and Input */}
        <ChatContainer 
          chatId={chat.id} 
          initialMessages={chat.messages}
          userImageUrl={userImageUrl}
          userName={userName}
          clientData={selectedClient}
          onTitleUpdate={setCurrentTitle}
        />
      </div>
      
      {/* Client Context Sidebar - Always visible */}
      <ClientContextSidebar 
        chatId={chat.id}
        selectedClientId={chat.clientId}
        clients={clients}
        hasActiveChat={true}
        chatContextFields={chat.contextFields}
      />
    </div>
  )
} 