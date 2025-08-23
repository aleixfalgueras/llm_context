'use client'

import {useEffect, useRef, useState} from 'react'
import {GripVertical, Lightbulb, MessageSquare, Plus, User} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {ClientCombobox} from '@/components/ui/client-combobox'
import {
  CLIENT_CONTEXT_FIELDS,
  ClientContextSelection,
  DEFAULT_CLIENT_CONTEXT
} from '@/lib/types/client-types'
import {useRouter} from 'next/navigation'
import {Client} from '@prisma/client'
import {useTranslations} from '@/lib/translations/context'

interface ClientContextSidebarProps {
  chatId?: string
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
  clients?: Client[]
  hasActiveChat?: boolean // Whether there's an active chat selected
  clientContext?: ClientContextSelection
  onClientContextChange?: (context: ClientContextSelection) => void
  chatContextFields?: string[] // Context fields that were selected for an existing chat
  isMobile?: boolean // Whether this is being rendered in mobile overlay mode
}

export function ClientContextSidebar({ 
  selectedClientId = null, 
  onClientSelect,
  clients = [],
  hasActiveChat = false,
  clientContext = DEFAULT_CLIENT_CONTEXT,
  onClientContextChange,
  chatContextFields = [],
  isMobile = false
}: ClientContextSidebarProps) {
  const t = useTranslations('assistant')
  const router = useRouter()
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 300 // Minimum 300px
      const maxWidth = 576 // Maximum 576px
      
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
      setSidebarWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const selectedClient = clients.find(client => client.id === selectedClientId)

  const handleCreateChat = async () => {
    if (!selectedClientId) return
    
    setIsCreatingChat(true)
    try {
      // Convert clientContext selections to array of field names, but only include fields where client has data
      const selectedFields = Object.entries(clientContext)
        .filter(([key, value]) => {
          if (!value) return false
          
          // Only include fields where the client actually has data
          if (!(key in CLIENT_CONTEXT_FIELDS)) return false
          return selectedClient?.[key as keyof typeof selectedClient]
        })
        .map(([key]) => key)
      
      // Navigate to new chat with client and context data in URL params
      // The chat will be created when the first message is sent via the API
      const params = new URLSearchParams({
        clientId: selectedClientId,
        contextFields: JSON.stringify(selectedFields)
      })
      router.push(`/assistant/chat/new?${params.toString()}`)
      // Don't reset loading state here - let the navigation complete
    } catch (error) {
      console.error('Failed to create chat:', error)
      setIsCreatingChat(false) // Only reset on error
    }
  }

  return (
    <div 
      ref={sidebarRef}
      className={`flex h-full relative ${
        isMobile 
          ? 'bg-background w-full' 
          : 'border-l bg-background'
      }`}
      style={isMobile ? {} : { width: `${sidebarWidth}px` }}
    >
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
      {/* Resize Handle - Only show on desktop */}
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10 group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-500 text-white p-1 rounded">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar Content */}
      <div className={`flex flex-col flex-1 ${isMobile ? '' : 'ml-1'}`}>
        {/* Header */}
        <div className="p-2 sm:p-4">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base truncate">
              {t('clientContextSidebar.clientInformation')}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {!hasActiveChat ? (
            // Show client selector and context when no active chat (Assistant page)  
            <div className="space-y-4">
              {/* Client Selector */}
              {clients.length > 0 && onClientSelect && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">{t('clientContextSidebar.selectClient')}</Label>
                  <ClientCombobox
                    clients={clients}
                    value={selectedClientId || ''}
                    onValueChange={(value) => onClientSelect(value || null)}
                    placeholder={t('clientContextSidebar.chooseClient')}
                    searchPlaceholder={t('clientContextSidebar.searchClients')}
                    emptyMessage={t('clientContextSidebar.noClientsFound')}
                  />
                </div>
              )}

              {selectedClient && (
                <>
                  {/* Client Context Selection - Only shown before chat creation */}
                  {onClientContextChange && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">{t('clientContextSidebar.aiContextSelection')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('clientContextSidebar.contextSelectionDescription')}
                      </p>
                      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        {Object.entries(CLIENT_CONTEXT_FIELDS).map(([fieldKey, fieldLabel]) => {
                          const typedFieldKey = fieldKey as keyof ClientContextSelection;
                          const hasFieldData = selectedClient?.[typedFieldKey];
                          
                          if (!hasFieldData) return null;
                          
                          const displayLabel = fieldKey === 'country' 
                            ? `${fieldLabel} (${selectedClient.country})`
                            : fieldLabel;
                            
                          return (
                            <div key={fieldKey} className="flex items-center space-x-2">
                              <Checkbox
                                id={`context-${fieldKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                                checked={clientContext[typedFieldKey]}
                                onChange={(e) => onClientContextChange({
                                  ...clientContext,
                                  [typedFieldKey]: e.target.checked
                                })}
                                label={displayLabel}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange({
                            country: !!selectedClient?.country,
                            generalContext: !!selectedClient?.generalContext,
                            specificContext1: !!selectedClient?.specificContext1,
                            specificContext2: !!selectedClient?.specificContext2,
                            specificContext3: !!selectedClient?.specificContext3
                          })}
                        >
                          {t('clientContextSidebar.selectAll')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange({
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
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreatingChat ? t('clientContextSidebar.creatingChat') : t('clientContextSidebar.newChat')}
                  </Button>
                </>
              )}
            </div>
          ) : hasActiveChat ? (
            // Show selected client information when chat has started
            <div className="space-y-4">
              {/* Client Selector */}
              {clients.length > 0 && onClientSelect && (
                <div className="mb-4">
                  <ClientCombobox
                    clients={clients}
                    value={selectedClientId || ''}
                    onValueChange={(value) => onClientSelect(value || null)}
                    placeholder={t('clientContextSidebar.switchClient')}
                    searchPlaceholder={t('clientContextSidebar.searchClients')}
                    emptyMessage={t('clientContextSidebar.noClientsFound')}
                  />
                </div>
              )}

              {/* Show client info only if a client is selected */}
              {selectedClient && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">{selectedClient.name}</span>
                    </div>
                    <div className="space-y-2">
                      {selectedClient.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📧 {selectedClient.email}
                        </p>
                      )}
                      {selectedClient.country && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🌍 {selectedClient.country}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Selected Context Display - Read-only after chat created - only show if client selected */}
              {selectedClient && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('clientContextSidebar.aiContextUsed')}</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-xs">
                    {chatContextFields && chatContextFields.length > 0 ? (
                      chatContextFields.map(field => {
                        return CLIENT_CONTEXT_FIELDS[field as keyof typeof CLIENT_CONTEXT_FIELDS] || field
                      }).join(', ')
                    ) : t('clientContextSidebar.noneSelected')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('clientContextSidebar.contextSetFirstMessageOnly')}
                  </p>
                </div>
              )}

              {/* General Chat Info - Only show when no client is selected */}
              {!selectedClient && (
                <Card className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('clientContextSidebar.noClientSelected')}
                  </p>
                </Card>
              )}

              {/* Tips Section - Always show for both client and general chats */}
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-900 dark:text-amber-100 text-sm">{t('clientContextSidebar.tips')}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-amber-800 dark:text-amber-200">
                      • {t('clientContextSidebar.tipNewChatForTopics')}
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      • {t('clientContextSidebar.tipLongerConversations')}
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      • {t('clientContextSidebar.tipBePoliteRespectful')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 