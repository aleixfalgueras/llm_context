'use client'

import { useState, useEffect, useRef } from 'react'
import { User, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClientSelector } from './client-selector'
import { getClients } from '@/lib/client-actions'

interface ClientSidebarProps {
  isOpen: boolean
  onToggle: () => void
  chatId?: string
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
  clients?: any[]
  chatHasStarted?: boolean // Whether this is an existing chat or new chat selection
}

export function ClientSidebar({ 
  isOpen, 
  onToggle, 
  chatId,
  selectedClientId = null, 
  onClientSelect,
  clients = [],
  chatHasStarted = false
}: ClientSidebarProps) {
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
    if (isOpen && allClients.length === 0) {
      fetchClients()
    }
  }, [isOpen])

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

  if (!isOpen) {
    return null
  }

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
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <h2 className="font-semibold text-sm sm:text-base truncate">
                {chatHasStarted ? 'Client Information' : 'Select Client'}
              </h2>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chatHasStarted && selectedClient ? (
            // Show selected client information when chat has started
            <div className="space-y-4">
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
                💡 This client's information has been provided as context for the AI to personalize responses.
              </div>
            </div>
          ) : (
            // Show client selector when no chat has started
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {allClients.length > 0 
                  ? "Select a client to provide context for your chat conversation. The AI will use their information to give personalized responses."
                  : "No clients found. Create a client first to enable personalized AI conversations."
                }
              </div>
              
              {allClients.length > 0 && onClientSelect && (
                <ClientSelector
                  clients={allClients}
                  selectedClientId={selectedClientId}
                  onClientSelect={onClientSelect}
                  placeholder="Choose a client..."
                />
              )}
              
              {selectedClientId && selectedClient && (
                <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100 text-sm">Selected Client</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedClient.name}</h4>
                    {selectedClient.email && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
                    )}
                  </div>
                </Card>
              )}
              
              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                💡 Start a new chat to begin a conversation with the selected client context.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 