'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Download, Edit, Plus, Search, Trash2, TrashIcon} from 'lucide-react'
import {ALL_DOCUMENT_TYPES, type DocumentType, getDocumentTypeLabel} from '@/lib/types/document-types'
import {Document} from '@prisma/client'
import {useTranslations} from '@/lib/translations/context'

interface DocumentListProps {
  documents: Document[]
  loading: boolean
  selectedDocument: Document | null
  onViewDocument: (document: Document) => void
  onEditDocument: (document: Document) => void
  onDeleteDocument: (document: Document) => void
  onDeleteAllDocuments: () => void
  onDownloadDocument: (document: Document) => void
  onCreateNew: () => void
  showDeleteAllConfirm: boolean
  setShowDeleteAllConfirm: (show: boolean) => void
}

export function DocumentList({
  documents,
  loading,
  selectedDocument,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onDeleteAllDocuments,
  onDownloadDocument,
  onCreateNew,
  showDeleteAllConfirm,
  setShowDeleteAllConfirm
}: DocumentListProps) {
  const t = useTranslations('documents')
  const tCommon = useTranslations('common')
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('')

  const filteredDocuments = (documents || []).filter((doc) => {
    const matchesSearch = searchTerm === '' || 
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = documentTypeFilter === '' || documentTypeFilter === 'all' || 
      doc.documentType === documentTypeFilter

    return matchesSearch && matchesType
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInHours < 1) {
      return t('time.justNow')
    } else if (diffInHours < 24) {
      return t('time.hoursAgo', { count: Math.floor(diffInHours) })
    } else if (diffInDays < 7) {
      return t('time.daysAgo', { count: Math.floor(diffInDays) })
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="w-1/3 border-r border-border flex flex-col overflow-hidden">
      {/* Header with actions */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">{t('list.title', { count: documents.length })}</h3>
        <div className="flex gap-2 mb-4 justify-between">
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (showDeleteAllConfirm) {
                  onDeleteAllDocuments()
                } else {
                  setShowDeleteAllConfirm(true)
                }
              }}
              className={`transition-all duration-200 ${
                showDeleteAllConfirm 
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              } shadow-sm`}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {showDeleteAllConfirm ? t('actions.deleteAllConfirm') : t('actions.deleteAll')}
            </Button>
          )}
          <Button size="sm" onClick={onCreateNew} variant="blue">
            <Plus className="h-4 w-4 mr-1" />
            {t('actions.createNew')}
          </Button>
        </div>
        
        {/* Search and Filter Controls */}
        {documents.length > 0 && (
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Document Type Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="typeFilter" className="text-sm font-medium whitespace-nowrap">
                {t('filters.filterByType')}
              </Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('search.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.allTypes')}</SelectItem>
                  {ALL_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getDocumentTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || (documentTypeFilter && documentTypeFilter !== 'all')) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t('filters.activeFilters')}</span>
                {searchTerm && (
                  <span className="px-2 py-1 rounded text-sm">
                    {t('filters.searchFilter', { term: searchTerm })}
                  </span>
                )}
                {documentTypeFilter && documentTypeFilter !== 'all' && (
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                    {t('filters.typeFilter', { type: getDocumentTypeLabel(documentTypeFilter as DocumentType) })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setDocumentTypeFilter('all')
                  }}
                  className="h-6 px-2 text-xs"
                >
                  {t('filters.clearAll')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Document List */}
      <div className="space-y-2 overflow-y-auto flex-1 p-4">
        {loading ? (
          <p className="text-muted-foreground">{t('list.loading')}</p>
        ) : filteredDocuments.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-1">{t('search.noResultsFor', { term: searchTerm })}</p>
              <p className="text-sm text-muted-foreground">{t('search.tryDifferent')}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('search.noDocuments')}</p>
          )
        ) : (
          filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className={`cursor-pointer transition-all duration-200 ${
                selectedDocument?.id === doc.id 
                  ? 'bg-blue-50 dark:bg-blue-950 shadow-md ' 
                  : 'hover:bg-blue-50/50 dark:hover:bg-blue-950/10 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
              onClick={() => onViewDocument(doc)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{doc.documentName}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{getDocumentTypeLabel(doc.documentType as DocumentType)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('list.updated', { date: formatDate(doc.updatedAt.toString()) })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* Top row: Edit and Delete */}
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditDocument(doc)
                        }}
                        title={t('actions.edit')}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteDocument(doc)
                        }}
                        title={t('actions.delete')}
                      >
                        <Trash2 className="h-3 w-3 text-red-600 hover:text-red-700" />
                      </Button>
                    </div>
                    {/* Bottom row: Download */}
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownloadDocument(doc)
                        }}
                        title={t('actions.download')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 