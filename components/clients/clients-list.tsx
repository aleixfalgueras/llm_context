'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, User, Grid, List } from 'lucide-react'
import { deleteClient } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'

import { ClientGridView } from '@/components/clients/client-grid-view'
import { ClientTableView } from '@/components/clients/client-table-view'
import { ClientPagination } from '@/components/clients/client-pagination'
import { ClientEmptyState } from '@/components/clients/client-empty-state'
import { UsageInfo, Client, LanguageInfo, ClientActionHandlers, PaginationInfo } from '@/types/client-list-types'
import { ViewMode, ButtonVariant, ToastVariant } from '@/types/enums'

interface ClientsListProps {
  clients: Client[]
  usageInfo?: UsageInfo | null // Optional since we no longer pre-load it
  onEditClient: (client: Client) => void
  onAddClient: () => void
  onRefresh: () => void
  onViewDocuments: (client: Client) => void
}

export function ClientsList({ clients, onEditClient, onAddClient, onRefresh, onViewDocuments }: ClientsListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 12

  // Available languages for document generation
  const languages = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'spanish', label: 'Spanish', flag: '🇪🇸' },
    { value: 'french', label: 'French', flag: '🇫🇷' },
    { value: 'german', label: 'German', flag: '🇩🇪' },
    { value: 'italian', label: 'Italian', flag: '🇮🇹' },
    { value: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
    { value: 'dutch', label: 'Dutch', flag: '🇳🇱' },
    { value: 'polish', label: 'Polish', flag: '🇵🇱' },
    { value: 'russian', label: 'Russian', flag: '🇷🇺' },
    { value: 'catalan', label: 'Catalan', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  ]

  // Helper to get language display info
  const getLanguageInfo = (languageValue: string): LanguageInfo => {
    const language = languages.find(lang => lang.value === languageValue)
    return language || { value: 'english', label: 'English', flag: '🇺🇸' }
  }

  // Load saved view preference on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('clients-view-mode')
    if (savedViewMode && (savedViewMode === ViewMode.GRID || savedViewMode === ViewMode.TABLE)) {
      setViewMode(savedViewMode as ViewMode)
    }
  }, [])

  // Save view preference whenever it changes
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    localStorage.setItem('clients-view-mode', newViewMode)
  }

  const filteredClients = clients
    .filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(clientId)
    try {
      await deleteClient(clientId)
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      })

      onRefresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete client',
                    variant: ToastVariant.DESTRUCTIVE,
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Prepare data for child components
  const actionHandlers: ClientActionHandlers = {
    onEditClient,
    onViewDocuments,
    onDeleteClient: handleDelete
  }

  const paginationInfo: PaginationInfo = {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: filteredClients.length,
    startIndex,
    endIndex
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold">Clients</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your client profiles and track their marketing projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === ViewMode.GRID ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => handleViewModeChange(ViewMode.GRID)}
              className="px-3 py-1.5 h-auto"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === ViewMode.TABLE ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => handleViewModeChange(ViewMode.TABLE)}
              className="px-3 py-1.5 h-auto"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search with Add Client Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={onAddClient} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          title="Add a new client"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Clients Display */}
      {filteredClients.length === 0 ? (
        <ClientEmptyState searchTerm={searchTerm} onAddClient={onAddClient} />
      ) : (
        <div className="space-y-0">
          {viewMode === ViewMode.GRID ? (
            <ClientGridView 
              clients={paginatedClients}
              actionHandlers={actionHandlers}
              isDeleting={isDeleting}
              getLanguageInfo={getLanguageInfo}
            />
          ) : (
            <ClientTableView 
              clients={paginatedClients}
              actionHandlers={actionHandlers}
              isDeleting={isDeleting}
              getLanguageInfo={getLanguageInfo}
            />
          )}
          <ClientPagination 
            paginationInfo={paginationInfo}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
} 