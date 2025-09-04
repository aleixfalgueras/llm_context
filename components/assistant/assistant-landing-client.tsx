'use client'

import {useState, useMemo} from 'react'
import {useRouter} from 'next/navigation'
import {ChatSidebar} from '@/components/assistant/chat-sidebar'
import {ChatInterface} from '@/components/assistant/chat-interface'
import {ClientContextSidebar} from '@/components/assistant/client-context-sidebar'
import {ClientContextSelection, DEFAULT_CLIENT_CONTEXT} from "@/lib/types/client-types";
import {Chat, Client} from '@prisma/client'
import {Plus, MessageSquare, User} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {ClientCombobox} from '@/components/ui/client-combobox'
import {useTranslations} from '@/lib/translations/context'
import {getClientContextFields} from '@/lib/utils/client-context-utils'
import {ScrollArea} from '@/components/ui/scroll-area'

interface AssistantLandingClientProps {
  chats: Chat[]
  clients: Client[]
}

export function AssistantLandingClient({ chats, clients }: AssistantLandingClientProps) {
  const router = useRouter()
  const t = useTranslations('assistant')
  const tContext = useTranslations('clientContext')
  const contextFields = useMemo(() => getClientContextFields(tContext), [tContext])
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [clientContext, setClientContext] = useState<ClientContextSelection>(DEFAULT_CLIENT_CONTEXT)
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  const selectedClientObj = clients.find(client => client.id === selectedClient)

  const handleCreateChat = async () => {
    setIsCreatingChat(true)
    try {
      if (selectedClient && selectedClientObj) {
        // Convert clientContext selections to array of field names, but only include fields where client has data
        const selectedFields = Object.entries(clientContext)
          .filter(([key, value]) => {
            if (!value) return false
            // Only include fields where the client actually has data
            if (!(key in contextFields)) return false
            return selectedClientObj?.[key as keyof typeof selectedClientObj]
          })
          .map(([key]) => key)
        
        // Navigate to new chat with client and context data in URL params
        const params = new URLSearchParams({
          clientId: selectedClient,
          contextFields: JSON.stringify(selectedFields)
        })
        router.push(`/assistant/chat/new?${params.toString()}`)
      } else {
        // Navigate to new chat without client
        router.push('/assistant/chat/new')
      }
    } catch (error) {
      console.error('Failed to create chat:', error)
      setIsCreatingChat(false) // Only reset on error
    }
  }

  return (
    <>
      {/* Mobile Layout - Visible on small screens */}
      <div className="h-full sm:hidden relative">
        {/* Loading Overlay */}
        {isCreatingChat && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <p className="font-medium text-gray-900 dark:text-gray-100">{t('clientContextSidebar.creatingChat')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('clientContextSidebar.settingUpConversation')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Single ScrollArea for entire mobile content */}
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* App Header */}
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h1 className="text-lg font-semibold">{t('title')}</h1>
            </div>
            
            {/* Client Selector */}
            {clients.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{t('clientContextSidebar.selectClient')}</span>
                </Label>
                <ClientCombobox
                  clients={clients}
                  value={selectedClient || ''}
                  onValueChange={(value) => setSelectedClient(value || null)}
                  placeholder={t('clientContextSidebar.chooseClient')}
                  searchPlaceholder={t('clientContextSidebar.searchClients')}
                  emptyMessage={t('clientContextSidebar.noClientsFound')}
                />
              </div>
            )}

            {/* Client Context Selection - Only shown when client is selected */}
            {selectedClientObj && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t('clientContextSidebar.aiContextSelection')}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('clientContextSidebar.contextSelectionDescription')}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  {Object.entries(contextFields).map(([fieldKey, fieldLabel]) => {
                    const typedFieldKey = fieldKey as keyof ClientContextSelection;
                    const hasFieldData = selectedClientObj?.[typedFieldKey];
                    
                    if (!hasFieldData) return null;
                    
                    const displayLabel = fieldKey === 'country' 
                      ? `${fieldLabel} (${selectedClientObj.country})`
                      : fieldLabel;
                      
                    return (
                      <div key={fieldKey} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mobile-context-${fieldKey}`}
                          checked={clientContext[typedFieldKey]}
                          onChange={(e) => setClientContext({
                            ...clientContext,
                            [typedFieldKey]: e.target.checked
                          })}
                          label={displayLabel}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setClientContext({
                      country: !!selectedClientObj?.country,
                      generalContext: !!selectedClientObj?.generalContext,
                      specificContext1: !!selectedClientObj?.specificContext1,
                      specificContext2: !!selectedClientObj?.specificContext2,
                      specificContext3: !!selectedClientObj?.specificContext3
                    })}
                  >
                    {t('clientContextSidebar.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setClientContext({
                      country: false,
                      generalContext: false,
                      specificContext1: false,
                      specificContext2: false,
                      specificContext3: false
                    })}
                  >
                    {t('clientContextSidebar.deselectAll')}
                  </Button>
                </div>
              </div>
            )}
            
            {/* New Chat Button */}
            <Button 
              onClick={handleCreateChat}
              disabled={isCreatingChat}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingChat ? t('clientContextSidebar.creatingChat') : 
               selectedClientObj ? t('clientContextSidebar.newChat') : t('newChat')}
            </Button>

            {/* Chat Sidebar Content - Inline for mobile */}
            <ChatSidebar 
              chats={chats}
              hideNewChatButton={true}
              isMobile={true}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Desktop Layout - Hidden on small screens */}
      <div className="hidden sm:flex h-full overflow-hidden">
        <ChatSidebar 
          chats={chats}
          hideNewChatButton={true}
        />
        <div className="flex-1 flex items-center justify-center min-w-0">
          <ChatInterface onStartGeneralChat={handleCreateChat} isCreatingGeneralChat={isCreatingChat} />
        </div>
        
        {/* Client Context Sidebar - Always visible on desktop */}
        <ClientContextSidebar 
          clients={clients}
          selectedClientId={selectedClient}
          onClientSelect={setSelectedClient}
          hasActiveChat={false}
          clientContext={clientContext}
          onClientContextChange={setClientContext}
        />
      </div>
    </>
  )
}