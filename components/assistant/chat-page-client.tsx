'use client'

import {useState} from 'react'
import {Menu, User, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {ChatSidebar} from '@/components/assistant/chat-sidebar'
import {ChatContainer} from '@/components/assistant/chat-container'
import {ClientContextSidebar} from '@/components/assistant/client-context-sidebar'
import {ClientDocuments} from '@/components/clients/client-documents'
import {ErrorBoundary} from '@/components/global/error-boundary'
import {handleClientApiError} from '@/lib/api/api-toast'
import {Chat, Client} from '@prisma/client'
import {ChatWithMessages} from "@/lib/types/chat-types";

interface ChatPageClientProps {
  chat: ChatWithMessages
  chats: Chat[]
  clients: Client[]
  userImageUrl?: string
  userName: string
  lastUsedModel?: string
  isNewChat?: boolean
}

export function ChatPageClient({ chat, chats, clients, userImageUrl, userName, lastUsedModel, isNewChat }: ChatPageClientProps) {
  const [currentTitle, setCurrentTitle] = useState(chat.title)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [documentToHighlight, setDocumentToHighlight] = useState<string | null>(null)
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false)
  const [isClientSidebarOpen, setIsClientSidebarOpen] = useState(false)

  // Get selected client info for context (if chat has a client)
  const selectedClient = chat.clientId ? clients.find(client => client.id === chat.clientId) : null

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
        handleClientApiError(error.message, 'Chat error occurred - please try refreshing')
      }}
    >
      <div className="flex h-full overflow-hidden relative">
        {/* Mobile Chat Sidebar Overlay */}
        {isChatSidebarOpen && (
          <div className="wide:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsChatSidebarOpen(false)} />
            <div className="relative flex flex-col w-80 bg-background border-r shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Chats</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ErrorBoundary>
                  <ChatSidebar 
                    chats={chats}
                    currentChatId={chat.id}
                    isMobile={true}
                    onChatSelect={() => setIsChatSidebarOpen(false)}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Client Sidebar Overlay */}
        {isClientSidebarOpen && (
          <div className="wide:hidden fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsClientSidebarOpen(false)} />
            <div className="relative flex flex-col w-80 bg-background border-l shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Client Info</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsClientSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ErrorBoundary>
                  <ClientContextSidebar 
                    chatId={chat.id}
                    selectedClientId={chat.clientId}
                    clients={clients}
                    hasActiveChat={true}
                    chatContextFields={chat.contextFields}
                    isMobile={true}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Chat Sidebar */}
        <div className="hidden wide:block flex-shrink-0 h-full">
          <ErrorBoundary>
            <ChatSidebar 
              chats={chats}
              currentChatId={chat.id}
            />
          </ErrorBoundary>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Enhanced Chat Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {/* Mobile Chat Sidebar Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="wide:hidden"
                  onClick={() => setIsChatSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <h1 className="font-semibold text-lg truncate">{currentTitle}</h1>
              </div>
              {/* Mobile Client Sidebar Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="wide:hidden"
                onClick={() => setIsClientSidebarOpen(true)}
              >
                <User className="h-4 w-4" />
              </Button>
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
        
        {/* Desktop Client Context Sidebar */}
        <div className="hidden wide:block flex-shrink-0 h-full">
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