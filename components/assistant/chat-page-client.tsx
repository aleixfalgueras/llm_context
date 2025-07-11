'use client'

import { useState } from 'react'
import { ChatSidebar } from '@/components/assistant/chat-sidebar'
import { ChatContainer } from '@/components/assistant/chat-container'
import { ClientContextSidebar } from '@/components/clients/client-context-sidebar'
import { ClientDocuments } from '@/components/clients/client-documents'
import { ErrorBoundary } from '@/components/global/error-boundary'

interface ChatPageClientProps {
  chat: {
    id: string
    title: string
    messages: any[]
    clientId: string
    contextFields?: string[]
  }
  chats: any[]
  clients: any[]
  userImageUrl?: string
  userName: string
  lastUsedModel?: string
  isNewChat?: boolean
}

export function ChatPageClient({ chat, chats, clients, userImageUrl, userName, lastUsedModel, isNewChat }: ChatPageClientProps) {
  const [currentTitle, setCurrentTitle] = useState(chat.title)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [documentToHighlight, setDocumentToHighlight] = useState<string | null>(null)

  // Get selected client info for context
  const selectedClient = clients.find(client => client.id === chat.clientId)

  // Handle document creation (for chat export)
  const handleDocumentCreated = (clientId: string, documentId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      setDocumentToHighlight(documentId)
      setIsDocumentsOpen(true)
    }
  }

  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('Chat page error:', error, errorInfo)
        // Could add error reporting here
      }}
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex-shrink-0 h-full">
          <ErrorBoundary>
            <ChatSidebar 
              chats={chats}
              currentChatId={chat.id}
            />
          </ErrorBoundary>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
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
            chatTitle={currentTitle}
            onDocumentCreated={handleDocumentCreated}
            lastUsedModel={lastUsedModel}
            newChatParams={isNewChat ? {
              clientId: chat.clientId,
              contextFields: chat.contextFields || []
            } : undefined}
          />
        </div>
        
        {/* Client Context Sidebar - Always visible */}
        <div className="flex-shrink-0 h-full">
          <ErrorBoundary>
            <ClientContextSidebar 
              chatId={chat.id}
              selectedClientId={chat.clientId}
              clients={clients}
              hasActiveChat={true}
              chatContextFields={chat.contextFields}
            />
          </ErrorBoundary>
        </div>

        {/* Client Documents Dialog */}
        {selectedClient && (
          <ErrorBoundary>
            <ClientDocuments
              clientId={selectedClient.id}
              clientName={selectedClient.name}
              open={isDocumentsOpen}
              onOpenChange={setIsDocumentsOpen}
              documentToHighlight={documentToHighlight}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  )
} 