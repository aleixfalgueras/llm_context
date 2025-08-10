'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {ArrowDownAZ, Calendar, Grid, List, Plus, Search, User} from 'lucide-react'

import {ClientGridView} from '@/components/clients/client-grid-view'
import {ClientTableView} from '@/components/clients/client-table-view'
import {ClientPagination} from '@/components/clients/client-pagination'
import {ClientEmptyState} from '@/components/clients/client-empty-state'
import {Client, ClientActionHandlers, UsageInfo} from '@/lib/types/client-list-types'
import {ButtonVariant, ClientSortMode, ViewMode} from '@/lib/types/enums'
import {useClientList} from '@/hooks/client/use-client-list'

interface ClientsListProps {
  clients: Client[]
  usageInfo?: UsageInfo | null // Optional since we no longer pre-load it
  onEditClient: (client: Client) => void
  onViewClient: (client: Client) => void
  onAddClient: () => void
  onRefresh: () => void
  onViewDocuments: (client: Client) => void
}

export function ClientsList({ clients, onEditClient, onViewClient, onAddClient, onRefresh, onViewDocuments }: ClientsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const {
    // State
    searchTerm,
    viewMode,
    sortMode,
    filteredClients,
    paginatedClients,
    paginationInfo,
    
    // Actions
    setSearchTerm,
    setViewMode,
    setSortMode,
    setCurrentPage,
    deleteClient,
    getLanguageInfo,
  } = useClientList({ clients, itemsPerPage: 12 })

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    setIsDeleting(clientId)
    try {
      await deleteClient(clientId, clientName)
      onRefresh()
    } catch (error) {
      console.error('Delete error handled by hook:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Prepare data for child components
  const actionHandlers: ClientActionHandlers = {
    onEditClient,
    onViewClient,
    onViewDocuments,
    onDeleteClient: handleDelete
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
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
          {/* Sort Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              variant={sortMode === ClientSortMode.CREATED ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => setSortMode(ClientSortMode.CREATED)}
              className="px-3 py-1.5 h-auto"
              title="Sort by creation date"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={sortMode === ClientSortMode.NAME ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => setSortMode(ClientSortMode.NAME)}
              className="px-3 py-1.5 h-auto"
              title="Sort by name"
            >
              <ArrowDownAZ className="h-4 w-4" />
            </Button>
          </div>
          {/* View Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === ViewMode.GRID ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => setViewMode(ViewMode.GRID)}
              className="px-3 py-1.5 h-auto"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === ViewMode.TABLE ? ButtonVariant.DEFAULT : ButtonVariant.GHOST}
              size="sm"
              onClick={() => setViewMode(ViewMode.TABLE)}
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
          title="Add a new client"
          variant="blue"
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