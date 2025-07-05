'use client'

import { useState, useCallback } from 'react'
import { useUsageLimits } from './use-usage-limits'
import type { Client } from '@/types/client'

interface UseClientManagementReturn {
  // State
  selectedClient: Client | null
  
  // Dialog states
  isDialogOpen: boolean
  isDocumentsOpen: boolean
  showLimitDialog: boolean
  editingClient: Client | null
  limitMessage: string
  
  // Actions
  handleAddClient: () => Promise<void>
  handleEditClient: (client: Client) => void
  handleViewDocuments: (client: Client) => void
  setIsDialogOpen: (open: boolean) => void
  setIsDocumentsOpen: (open: boolean) => void
  setShowLimitDialog: (show: boolean) => void
  checkUsageLimits: () => Promise<boolean>
  refreshClients: () => void
}

export function useClientManagement(): UseClientManagementReturn {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
  
  const { checkClientLimit } = useUsageLimits()

  const handleAddClient = useCallback(async () => {
    // Check usage limits only when user tries to add a client
    const limitCheck = await checkClientLimit()
    if (!limitCheck.canAdd) {
      // Show limit dialog instead of toast
      setLimitMessage(limitCheck.message)
      setShowLimitDialog(true)
      return
    }
    
    // User can add clients, proceed with normal flow
    setEditingClient(null)
    setIsDialogOpen(true)
  }, [checkClientLimit])

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }, [])

  const handleViewDocuments = useCallback((client: Client) => {
    setSelectedClient(client)
    setIsDocumentsOpen(true)
  }, [])

  const checkUsageLimits = useCallback(async (): Promise<boolean> => {
    const limitCheck = await checkClientLimit()
    return limitCheck.canAdd
  }, [checkClientLimit])

  const refreshClients = useCallback(() => {
    // This would typically trigger a refetch of clients
    // Implementation depends on how the parent component manages client data
    window.location.reload()
  }, [])

  return {
    // State
    selectedClient,
    
    // Dialog states
    isDialogOpen,
    isDocumentsOpen,
    showLimitDialog,
    editingClient,
    limitMessage,
    
    // Actions
    handleAddClient,
    handleEditClient,
    handleViewDocuments,
    setIsDialogOpen,
    setIsDocumentsOpen,
    setShowLimitDialog,
    checkUsageLimits,
    refreshClients,
  }
}