'use client'

import { useState, useMemo, useCallback } from 'react'
import { useLocalStorage } from '../use-local-storage'
import { useToast } from '@/hooks/use-toast'
import { deleteClient as deleteClientAction } from '@/app/actions/client-action'
import type { Client } from '@prisma/client'
import type { PaginationInfo, LanguageInfo } from '@/lib/types/client-list-types'
import { ClientSortMode } from '@/lib/enums'

type ViewMode = 'grid' | 'table'

interface UseClientListProps {
  clients: Client[]
  itemsPerPage?: number
}

interface UseClientListReturn {
  // State
  searchTerm: string
  viewMode: ViewMode
  sortMode: ClientSortMode
  currentPage: number
  filteredClients: Client[]
  paginatedClients: Client[]
  paginationInfo: PaginationInfo
  
  // Actions
  setSearchTerm: (term: string) => void
  setViewMode: (mode: ViewMode) => void
  setSortMode: (mode: ClientSortMode) => void
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

  // Persist sort mode in localStorage
  const { value: sortMode, setValue: setSortMode } = useLocalStorage<ClientSortMode>(
    'clientsSortMode', 
    ClientSortMode.CREATED
  )

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = clients || []

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.generalContext?.toLowerCase().includes(searchLower) ||
        client.country?.toLowerCase().includes(searchLower) ||
        client.documentsLanguage?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortMode) {
        case ClientSortMode.NAME:
          return a.name.localeCompare(b.name)
        case ClientSortMode.CREATED:
        default:
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [clients, searchTerm, sortMode])

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
      await deleteClientAction(id)

      toast({
        title: 'Client Deleted',
        description: `"${name}" has been deleted successfully.`,
      })

      // The server action already handles revalidation, so we don't need to reload
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
    sortMode,
    currentPage,
    filteredClients,
    paginatedClients,
    paginationInfo,
    
    // Actions
    setSearchTerm: setSearchTermWithReset,
    setViewMode,
    setSortMode,
    setCurrentPage,
    deleteClient,
    getLanguageInfo,
  }
}