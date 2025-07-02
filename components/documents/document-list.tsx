'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, Edit, Trash2, Download, Calendar, TrashIcon, Plus } from 'lucide-react'
import { ALL_DOCUMENT_TYPES, getDocumentTypeLabel, type DocumentType } from '@/types/document-types'
import { Document } from '@/types/component-types'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('')

  const filteredDocuments = documents.filter((doc) => {
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
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="w-1/3 border-r border-border flex flex-col overflow-hidden">
      {/* Header with actions */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
          <div className="flex gap-2">
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
                {showDeleteAllConfirm ? 'Click to Confirm' : 'Delete All'}
              </Button>
            )}
            <Button size="sm" onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        {documents.length > 0 && (
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Document Type Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="typeFilter" className="text-sm font-medium whitespace-nowrap">
                Filter by type:
              </Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
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
                <span>Active filters:</span>
                {searchTerm && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                    Search: "{searchTerm}"
                  </span>
                )}
                {documentTypeFilter && documentTypeFilter !== 'all' && (
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                    Type: {getDocumentTypeLabel(documentTypeFilter as DocumentType)}
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
                  Clear all
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Document List */}
      <div className="space-y-2 overflow-y-auto flex-1 p-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filteredDocuments.length === 0 ? (
          searchTerm ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-1">No documents found matching "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground">Try searching for a different term</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No documents found</p>
          )
        ) : (
          filteredDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className={`cursor-pointer transition-all duration-200 ${
                selectedDocument?.id === doc.id 
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-md' 
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
                      Updated: {formatDate(doc.updatedAt.toString())}
                    </p>
                    {doc.startDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.startDate.toString())}
                          {doc.endDate && ` - ${formatDate(doc.endDate.toString())}`}
                        </span>
                      </div>
                    )}
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
                        title="Edit Document"
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
                        title="Delete Document"
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
                        title="Download document as Markdown"
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