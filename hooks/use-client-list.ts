'use client'

import { useState, useMemo, useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import { useToast } from '@/hooks/use-toast'
import type { Client } from '@/types/client'
import type { PaginationInfo, LanguageInfo } from '@/types/client-list-types'

type ViewMode = 'grid' | 'table'

interface UseClientListProps {
  clients: Client[]
  itemsPerPage?: number
}

interface UseClientListReturn {
  // State
  searchTerm: string
  viewMode: ViewMode
  currentPage: number
  filteredClients: Client[]
  paginatedClients: Client[]
  paginationInfo: PaginationInfo
  
  // Actions
  setSearchTerm: (term: string) => void
  setViewMode: (mode: ViewMode) => void
  setCurrentPage: (page: number) => void
  deleteClient: (id: string, name: string) => Promise<void>
  getLanguageInfo: (language: string) => LanguageInfo
}

const LANGUAGE_INFO: Record<string, LanguageInfo> = {
  'es': { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  'en': { value: 'en', label: 'English', flag: '🇺🇸' },
  'ca': { value: 'ca', label: 'Catalan', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  'fr': { value: 'fr', label: 'French', flag: '🇫🇷' },
  'de': { value: 'de', label: 'German', flag: '🇩🇪' },
  'it': { value: 'it', label: 'Italian', flag: '🇮🇹' },
  'pt': { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  'nl': { value: 'nl', label: 'Dutch', flag: '🇳🇱' },
}

export function useClientList({ 
  clients, 
  itemsPerPage = 12 
}: UseClientListProps): UseClientListReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()
  
  // Persist view mode in localStorage
  const { value: viewMode, setValue: setViewMode } = useLocalStorage<ViewMode>(
    'clientsViewMode', 
    'grid'
  )

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients || []

    const searchLower = searchTerm.toLowerCase()
    return (clients || []).filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.generalContext?.toLowerCase().includes(searchLower) ||
      client.country?.toLowerCase().includes(searchLower) ||
      client.documentsLanguage?.toLowerCase().includes(searchLower)
    )
  }, [clients, searchTerm])

  // Calculate pagination
  const paginationInfo = useMemo((): PaginationInfo => {
    const totalItems = filteredClients.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return {
      totalPages,
      totalItems,
      currentPage,
      itemsPerPage,
      startIndex,
      endIndex,
    }
  }, [filteredClients.length, itemsPerPage, currentPage])

  // Get paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredClients.slice(startIndex, endIndex)
  }, [filteredClients, currentPage, itemsPerPage])

  // Reset to first page when search changes
  const setSearchTermWithReset = useCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }, [])

  const deleteClient = useCallback(async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      toast({
        title: 'Client Deleted',
        description: `"${name}" has been deleted successfully.`,
      })

      // Refresh the page to update the client list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const getLanguageInfo = useCallback((language: string): LanguageInfo => {
    return LANGUAGE_INFO[language?.toLowerCase()] || { value: language || 'unknown', label: language || 'Unknown', flag: '🌐' }
  }, [])

  return {
    // State
    searchTerm,
    viewMode,
    currentPage,
    filteredClients,
    paginatedClients,
    paginationInfo,
    
    // Actions
    setSearchTerm: setSearchTermWithReset,
    setViewMode,
    setCurrentPage,
    deleteClient,
    getLanguageInfo,
  }
}