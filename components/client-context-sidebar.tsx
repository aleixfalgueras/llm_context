'use client'

import { useState, useEffect, useRef } from 'react'
import { User, GripVertical, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { getClients } from '@/lib/client-actions'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { createChatAndReturn } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface ClientContextSidebarProps {
  chatId?: string
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
  clients?: any[]
  hasActiveChat?: boolean // Whether there's an active chat selected
  clientContext?: ClientContextSelection
  onClientContextChange?: (context: ClientContextSelection) => void
  currentChatId?: string | null
  onChatCreated?: (chatId: string) => void
  chatContextFields?: string[] // Context fields that were selected for an existing chat
}

export function ClientContextSidebar({ 
  chatId,
  selectedClientId = null, 
  onClientSelect,
  clients = [],
  hasActiveChat = false,
  clientContext = defaultClientContextSelections.general,
  onClientContextChange,
  currentChatId = null,
  onChatCreated,
  chatContextFields = []
}: ClientContextSidebarProps) {
  const router = useRouter()
  const [allClients, setAllClients] = useState<any[]>(clients)
  const [loading, setLoading] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default 320px to match chat sidebar
  const [isResizing, setIsResizing] = useState(false)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      const clientList = await getClients()
      setAllClients(clientList)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (allClients.length === 0) {
      fetchClients()
    }
  }, [])

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 320 // Minimum 320px for better readability
      const maxWidth = 600 // Maximum 600px
      
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

  const selectedClient = allClients.find(client => client.id === selectedClientId)

  const handleCreateChat = async () => {
    if (!selectedClientId) return
    
    setIsCreatingChat(true)
    try {
      // Convert clientContext selections to array of field names
      const selectedFields = Object.entries(clientContext)
        .filter(([key, value]) => value)
        .map(([key]) => key)
      
      const newChatId = await createChatAndReturn('New Chat', selectedClientId, selectedFields)
      if (onChatCreated) {
        onChatCreated(newChatId)
      }
      router.push(`/chat/${newChatId}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  return (
    <div 
      ref={sidebarRef}
      className="border-l bg-background flex h-full relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
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
      
      {/* Sidebar Content */}
      <div className="flex flex-col flex-1 ml-1">
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !hasActiveChat ? (
            // Show client selector and context when no active chat (Assistant page)  
            <div className="space-y-4">
              {/* Client Selector Dropdown */}
              {allClients.length > 0 && onClientSelect && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Select Client</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span className="truncate">
                            {selectedClient ? selectedClient.name : 'Choose a client...'}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full" align="start">
                      <DropdownMenuLabel>Select Client</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allClients.map((client) => (
                        <DropdownMenuItem
                          key={client.id}
                          onClick={() => onClientSelect(client.id)}
                          className={selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                        >
                          <User className="w-4 h-4 mr-2" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{client.name}</div>
                            {client.email && (
                              <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {selectedClient && !currentChatId ? (
                <>
                  {/* Client Context Selection - Only shown before chat creation */}
                  {onClientContextChange && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium">AI Context Selection</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose which client information to include when chatting with AI:
                      </p>
                      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        {selectedClient?.dateOfBirth && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-age"
                              checked={clientContext.age}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                age: e.target.checked
                              })}
                              label={`Age (${Math.floor((new Date().getTime() - new Date(selectedClient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years)`}
                            />
                          </div>
                        )}
                        {selectedClient?.height && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-height"
                              checked={clientContext.height}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                height: e.target.checked
                              })}
                              label={`Height (${selectedClient.height}cm)`}
                            />
                          </div>
                        )}
                        {selectedClient?.weight && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-weight"
                              checked={clientContext.weight}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                weight: e.target.checked
                              })}
                              label={`Weight (${selectedClient.weight}kg)`}
                            />
                          </div>
                        )}
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
                        {selectedClient?.goals && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-goals"
                              checked={clientContext.goals}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                goals: e.target.checked
                              })}
                              label="Goals"
                            />
                          </div>
                        )}
                        {selectedClient?.medicalHistory && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-medical"
                              checked={clientContext.medicalHistory}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                medicalHistory: e.target.checked
                              })}
                              label="Medical History"
                            />
                          </div>
                        )}
                        {selectedClient?.notes && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="context-notes"
                              checked={clientContext.notes}
                              onChange={(e) => onClientContextChange({
                                ...clientContext,
                                notes: e.target.checked
                              })}
                              label="General Notes"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange(defaultClientContextSelections.general)}
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onClientContextChange({
                            age: false,
                            height: false,
                            weight: false,
                            country: false,
                            goals: false,
                            medicalHistory: false,
                            notes: false
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
              ) : selectedClient && currentChatId ? (
                <>
                  {/* Simplified Client Info Card - Only name, email, country (After chat created) */}
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
                      {Object.entries(clientContext)
                        .filter(([key, value]) => value && selectedClient[key] !== undefined && selectedClient[key] !== null && selectedClient[key] !== '')
                        .map(([key]) => {
                          const fieldNames = {
                            age: 'Age',
                            height: 'Height',
                            weight: 'Weight',
                            country: 'Country',
                            goals: 'Goals',
                            medicalHistory: 'Medical History',
                            notes: 'General Notes'
                          }
                          return fieldNames[key as keyof typeof fieldNames]
                        })
                        .join(', ') || 'None selected'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Context is set for the first message only and cannot be changed during the chat.
                    </p>
                  </div>
                </>
              ) : !selectedClient ? (
                <div className="text-center text-gray-500 mt-8">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No Client Selected</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Choose a client above to start configuring AI context.
                  </p>
                </div>
              ) : null}
            </div>
          ) : hasActiveChat && selectedClient ? (
            // Show selected client information when chat has started
            <div className="space-y-4">
              {/* Client Selector Dropdown */}
              {allClients.length > 0 && onClientSelect && (
                <div className="mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span className="truncate">{selectedClient.name}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full" align="start">
                      <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allClients.map((client) => (
                        <DropdownMenuItem
                          key={client.id}
                          onClick={() => onClientSelect(client.id)}
                          className={selectedClient.id === client.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                        >
                          <User className="w-4 h-4 mr-2" />
                          <div className="min-w-0 flex-1">
                                                         <div className="font-medium truncate">{client.name}</div>
                            {client.email && (
                              <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    {selectedClient.goals && (
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-1">Goals:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border">
                          {selectedClient.goals}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Context Information Message */}
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
                  <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    ✅ AI Context Fields:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {chatContextFields?.map((field) => {
                      const fieldNames: Record<string, string> = {
                        age: 'Age',
                        height: 'Height',
                        weight: 'Weight',
                        country: 'Country',
                        goals: 'Goals',
                        medicalHistory: 'Medical History',
                        notes: 'General Notes'
                      }
                      return (
                        <span
                          key={field}
                          className="inline-block px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded text-xs"
                        >
                          {fieldNames[field] || field}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  These client fields were used as context for this chat.
                </p>
              </div>
            </div>
          ) : hasActiveChat && !selectedClient ? (
            // Show message when chat is selected but no client is associated
            <div className="space-y-4">
              <div className="text-center text-gray-500 mt-8">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No Client Selected</p>
                <p className="text-xs text-gray-400 mt-1">
                  This chat doesn't have a client associated with it. Create a new chat with a client for personalized responses.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
} 