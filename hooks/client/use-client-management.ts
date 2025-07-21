'use client'

import { useState, useCallback } from 'react'
import type { Client } from '@/types/client'

interface UseClientManagementReturn {
  // State
  selectedClient: Client | null
  
  // Dialog states
  isDialogOpen: boolean
  isDocumentsOpen: boolean
  editingClient: Client | null
  
  // Actions
  handleAddClient: () => void
  handleEditClient: (client: Client) => void
  handleViewDocuments: (client: Client) => void
  setIsDialogOpen: (open: boolean) => void
  setIsDocumentsOpen: (open: boolean) => void
  refreshClients: () => void
}

export function useClientManagement(): UseClientManagementReturn {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)

  const handleAddClient = useCallback(() => {
    setEditingClient(null)
    setIsDialogOpen(true)
  }, [])

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }, [])

  const handleViewDocuments = useCallback((client: Client) => {
    setSelectedClient(client)
    setIsDocumentsOpen(true)
  }, [])


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
    editingClient,
    
    // Actions
    handleAddClient,
    handleEditClient,
    handleViewDocuments,
    setIsDialogOpen,
    setIsDocumentsOpen,
    refreshClients,
  }
}