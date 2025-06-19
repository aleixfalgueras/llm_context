'use client'

import { useState, useEffect, useRef } from 'react'
import { User, GripVertical, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { getClients } from '@/lib/client-actions'

interface ClientContextSidebarProps {
  chatId?: string
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
  clients?: any[]
  hasActiveChat?: boolean // Whether there's an active chat selected
}

export function ClientContextSidebar({ 
  chatId,
  selectedClientId = null, 
  onClientSelect,
  clients = [],
  hasActiveChat = false
}: ClientContextSidebarProps) {
  const [allClients, setAllClients] = useState<any[]>(clients)
  const [loading, setLoading] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default 320px to match chat sidebar
  const [isResizing, setIsResizing] = useState(false)
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
            // Show message when no chat is selected
            <div className="space-y-4">
              <div className="text-center text-gray-500 mt-8">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No Chat Selected</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select a chat to view the client information associated with that conversation.
                </p>
              </div>
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
                    {selectedClient.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📱 {selectedClient.phone}
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
                    {selectedClient.medicalHistory && (
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-1">Medical History:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border">
                          {selectedClient.medicalHistory}
                        </p>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div className="mt-3">
                        <h4 className="font-medium text-sm mb-1">Notes:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded border">
                          {selectedClient.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              <div className="text-xs text-gray-500 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                💡 This client's information is being used as context for the AI to personalize responses.
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