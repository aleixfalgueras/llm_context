'use client'

import {useEffect, useRef, useState} from 'react'
import {GripVertical, Lightbulb, Plus, User} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {ClientCombobox} from '@/components/ui/client-combobox'
import {ClientContextSelection, defaultClientContextSelections} from '@/types/client-context'
import {CLIENT_CONTEXT_FIELD_LABELS} from '@/types/client'
// Removed createChatAndReturn - now using lazy chat creation via API
import {useRouter} from 'next/navigation'

interface ClientContextSidebarProps {
  chatId?: string
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
  clients?: any[]
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
  clientContext = defaultClientContextSelections.general,
  onClientContextChange,
  chatContextFields = [],
  isMobile = false
}: ClientContextSidebarProps) {
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
          switch (key) {
            case 'country':
              return selectedClient?.country
            case 'general_context':
              return selectedClient?.generalContext
            case 'specific_context_1':
              return selectedClient?.specificContext1
            case 'specific_context_2':
              return selectedClient?.specificContext2
            case 'specific_context_3':
              return selectedClient?.specificContext3
            default:
              return false
          }
        })
        .map(([key]) => key)
      
      // Navigate to new chat with client and context data in URL params
      // The chat will be created when the first message is sent via the API
      const params = new URLSearchParams({
        clientId: selectedClientId,
        contextFields: JSON.stringify(selectedFields)
      })
      router.push(`/assistant/chat/new?${params.toString()}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
    } finally {
      setIsCreatingChat(false)
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
              <p className="font-medium text-gray-900 dark:text-gray-100">Creating Chat...</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Setting up your conversation</p>
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
        <div className="p-2 sm:p-4 border-b">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base truncate">
              Client Information
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
                  <Label className="text-sm font-medium mb-2 block">Select Client</Label>
                  <ClientCombobox
                    clients={clients}
                    value={selectedClientId || ''}
                    onValueChange={(value) => onClientSelect(value || null)}
                    placeholder="Choose a client..."
                    searchPlaceholder="Search clients..."
                    emptyMessage="No clients found."
                  />
                </div>
              )}

              {selectedClient && (
                <>
                  {/* Client Context Selection - Only shown before chat creation */}
                  {onClientContextChange && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">AI Context Selection</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose which client information to include when chatting with AI. Your privacy choices are strictly respected.
                      </p>
                      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        {selectedClient?.country && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-country"
                              checked={clientContext.country}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                country: e.target.checked
                              })}
                              label={`Country (${selectedClient.country})`}
                            />
                          </div>
                        )}
                        {selectedClient?.generalContext && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-general-context"
                              checked={clientContext.general_context}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                general_context: e.target.checked
                              })}
                              label={CLIENT_CONTEXT_FIELD_LABELS.general_context}
                            />
                          </div>
                        )}
                        {selectedClient?.specificContext1 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-specific-context-1"
                              checked={clientContext.specific_context_1}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                specific_context_1: e.target.checked
                              })}
                              label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_1}
                            />
                          </div>
                        )}
                        {selectedClient?.specificContext2 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-specific-context-2"
                              checked={clientContext.specific_context_2}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                specific_context_2: e.target.checked
                              })}
                              label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_2}
                            />
                          </div>
                        )}
                        {selectedClient?.specificContext3 && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-specific-context-3"
                              checked={clientContext.specific_context_3}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                specific_context_3: e.target.checked
                              })}
                              label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_3}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange({
                            country: !!selectedClient?.country,
                            general_context: !!selectedClient?.generalContext,
                            specific_context_1: !!selectedClient?.specificContext1,
                            specific_context_2: !!selectedClient?.specificContext2,
                            specific_context_3: !!selectedClient?.specificContext3
                          })}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange({
                            country: false,
                            general_context: false,
                            specific_context_1: false,
                            specific_context_2: false,
                            specific_context_3: false
                          })}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* New Chat Button */}
                  <Button 
                    onClick={handleCreateChat}
                    disabled={isCreatingChat}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreatingChat ? 'Creating Chat...' : 'New Chat'}
                  </Button>
                </>
              )}
            </div>
          ) : hasActiveChat && selectedClient ? (
            // Show selected client information when chat has started
            <div className="space-y-4">
              {/* Client Selector */}
              {clients.length > 0 && onClientSelect && (
                <div className="mb-4">
                  <ClientCombobox
                    clients={clients}
                    value={selectedClientId || ''}
                    onValueChange={(value) => onClientSelect(value || null)}
                    placeholder="Switch client..."
                    searchPlaceholder="Search clients..."
                    emptyMessage="No clients found."
                  />
                </div>
              )}

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

              {/* Selected Context Display - Read-only after chat created */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Context Used:</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-xs">
                  {chatContextFields && chatContextFields.length > 0 ? (
                    chatContextFields.map(field => {
                      const fieldNames = {
                        country: 'Country',
                        general_context: 'General Context',
                        specific_context_1: 'Specific Context 1',
                        specific_context_2: 'Specific Context 2',
                        specific_context_3: 'Specific Context 3'
                      }
                      return fieldNames[field as keyof typeof fieldNames]
                    }).join(', ')
                  ) : 'None selected'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Context is set for the first message only and cannot be changed during the chat.
                </p>
              </div>

              {/* Tips Section */}
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-900 dark:text-amber-100 text-sm">Tips</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-amber-800 dark:text-amber-200">
                      • Start a new chat for different topics to improve response quality
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      • Longer conversations use more tokens and increase costs
                    </p>
                    <p className="text-amber-800 dark:text-amber-200">
                      • Be polite and respectful - good manners improve AI interactions
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No Client Associated</p>
              <p className="text-xs text-gray-400 mt-1">
                This chat doesn't have a client associated with it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 