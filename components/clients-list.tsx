'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Search, Plus, Edit, Trash2, User, FileText, Grid, List, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { deleteClient } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'

interface ClientsListProps {
  clients: any[]
  onEditClient: (client: any) => void
  onAddClient: () => void
  onRefresh: () => void
  onViewDocuments: (client: any) => void
}

export function ClientsList({ clients, onEditClient, onAddClient, onRefresh, onViewDocuments }: ClientsListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
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
  const getLanguageInfo = (languageValue: string) => {
    const language = languages.find(lang => lang.value === languageValue)
    return language || { value: 'english', label: 'English', flag: '🇺🇸' }
  }

  // Load saved view preference on component mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('clients-view-mode')
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'table')) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view preference whenever it changes
  const handleViewModeChange = (newViewMode: 'grid' | 'table') => {
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
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }



  const renderGridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {paginatedClients.map((client) => {
        const languageInfo = getLanguageInfo(client.documentsLanguage || 'english')
        return (
          <Card key={client.id} className="hover:shadow-lg transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDocuments(client)}
                    title="View Documents"
                  >
                    <FileText className="h-4 w-4 text-yellow-600 hover:text-yellow-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClient(client)}
                    title="Edit Client"
                  >
                    <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(client.id, client.name)}
                    disabled={isDeleting === client.id}
                    title="Delete Client"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
                             <div className="space-y-2">
                 {client.phone && (
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Phone:</span>
                     <span>{client.phone}</span>
                   </div>
                 )}

                 {client.country && (
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Country:</span>
                     <span>{client.country}</span>
                   </div>
                 )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Documents:</span>
                  <span className="flex items-center gap-1">
                    <span>{languageInfo.flag}</span>
                    <span>{languageInfo.label}</span>
                  </span>
                </div>

                {client.notes && (
                  <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-md">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Notes:</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-2">{client.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderTableView = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] hidden md:table-cell">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[130px] hidden lg:table-cell">
                Documents
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] sticky right-0 bg-gray-50 dark:bg-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedClients.map((client) => {
              const languageInfo = getLanguageInfo(client.documentsLanguage || 'english')
              return (
                                 <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                   <td className="px-4 py-4">
                     <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                       {client.name}
                     </div>
                     {client.email && (
                       <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                         {client.email}
                       </div>
                     )}
                     {client.phone && (
                       <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                         {client.phone}
                       </div>
                     )}
                   </td>
                   <td className="px-4 py-4 hidden md:table-cell">
                     <div className="text-sm text-gray-900 dark:text-gray-100">
                       {client.country || '-'}
                     </div>
                   </td>
                   <td className="px-4 py-4 hidden lg:table-cell">
                     <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                       <span>{languageInfo.flag}</span>
                       <span>{languageInfo.label}</span>
                     </div>
                   </td>
                   <td className="px-4 py-4 text-right sticky right-0 bg-white dark:bg-gray-900">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDocuments(client)}
                        title="View Documents"
                      >
                        <FileText className="h-4 w-4 text-yellow-600 hover:text-yellow-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClient(client)}
                        title="Edit Client"
                      >
                        <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={isDeleting === client.id}
                        title="Delete Client"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const delta = 2
      const range = []
      const rangeWithDots = []

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i)
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...')
      } else {
        rangeWithDots.push(1)
      }

      rangeWithDots.push(...range)

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages)
      } else {
        rangeWithDots.push(totalPages)
      }

      return rangeWithDots
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6 rounded-b-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> of{' '}
              <span className="font-medium">{filteredClients.length}</span> clients
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="relative inline-flex items-center rounded-l-md px-2 py-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span
                    key={index}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={index}
                    onClick={() => handlePageChange(page as number)}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                  >
                    {page}
                  </Button>
                )
              ))}
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="relative inline-flex items-center rounded-r-md px-2 py-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    )
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
            Manage your client profiles and track their health journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="px-3 py-1.5 h-auto"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              className="px-3 py-1.5 h-auto"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onAddClient} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search clients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Display */}
      {filteredClients.length === 0 ? (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-900 dark:text-gray-100 text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by adding your first client to begin tracking their health journey'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onAddClient} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-0">
          {viewMode === 'grid' ? renderGridView() : renderTableView()}
          {renderPagination()}
        </div>
      )}
    </div>
  )
} 