'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Edit, Trash2, Eye, Calendar, Send, Download, Search, TrashIcon } from 'lucide-react'
import { getClientDocuments, deleteDocument, deleteAllDocuments, getDocumentContent, updateDocumentContent, updateDocumentNameAndContent, createDocument } from '@/lib/document-actions'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Document {
  id: string
  documentName: string
  documentType: string
  documentPath: string
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface ClientDocumentsProps {
  clientId: string
  clientName: string
  clientEmail?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToHighlight?: string | null
}

export function ClientDocuments({ clientId, clientName, clientEmail, open, onOpenChange, documentToHighlight }: ClientDocumentsProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentContent, setDocumentContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [newDocumentName, setNewDocumentName] = useState('')
  const [newDocumentType, setNewDocumentType] = useState('')
  const [newDocumentContent, setNewDocumentContent] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editedDocumentName, setEditedDocumentName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [documentTypeFilter, setDocumentTypeFilter] = useState('')
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      loadDocuments()
    }
  }, [open, clientId])

  // Auto-open highlighted document
  useEffect(() => {
    if (documentToHighlight && documents.length > 0) {
      const documentToOpen = documents.find(doc => doc.id === documentToHighlight)
      if (documentToOpen) {
        handleViewDocument(documentToOpen)
      }
    }
  }, [documentToHighlight, documents])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await getClientDocuments(clientId)
      setDocuments(docs)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (document: Document) => {
    try {
      const content = await getDocumentContent(document.documentPath)
      setDocumentContent(content)
      setSelectedDocument(document)
      setEditedContent(content)
      setEditedDocumentName(document.documentName)
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    }
  }

  const handleEditDocumentDirect = async (document: Document) => {
    try {
      const content = await getDocumentContent(document.documentPath)
      setDocumentContent(content)
      setSelectedDocument(document)
      setEditedContent(content)
      setEditedDocumentName(document.documentName)
      setIsEditing(true) // Immediately enter edit mode
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    }
  }

  const handleEditDocument = () => {
    if (selectedDocument) {
      setEditedDocumentName(selectedDocument.documentName)
    }
    setIsEditing(true)
  }

  const handleSaveDocument = async () => {
    if (!selectedDocument) return

    if (!editedDocumentName.trim()) {
      toast({
        title: 'Error',
        description: 'Document name cannot be empty',
        variant: 'destructive',
      })
      return
    }

    try {
      await updateDocumentNameAndContent(selectedDocument.id, editedDocumentName, editedContent)
      setDocumentContent(editedContent)
      setSelectedDocument({ ...selectedDocument, documentName: editedDocumentName })
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      })
      await loadDocuments() // Refresh the list to show updated timestamp and name
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.documentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteDocument(document.id)
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      })
      await loadDocuments()
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null)
        setDocumentContent('')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAllDocuments = async () => {
    if (documents.length === 0) {
      toast({
        title: 'No documents',
        description: 'There are no documents to delete',
      })
      return
    }

    if (showDeleteAllConfirm) {
      try {
        const result = await deleteAllDocuments(clientId)
        toast({
          title: 'Success',
          description: `${result.deletedCount} documents deleted successfully`,
        })
        await loadDocuments()
        setSelectedDocument(null)
        setDocumentContent('')
        setShowDeleteAllConfirm(false)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete all documents',
          variant: 'destructive',
        })
        setShowDeleteAllConfirm(false)
      }
    } else {
      setShowDeleteAllConfirm(true)
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteAllConfirm(false), 3000)
    }
  }

  const handleCreateDocument = async () => {
    if (!newDocumentName.trim() || !newDocumentType.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      await createDocument(
        clientId,
        newDocumentName,
        newDocumentType,
        newDocumentContent,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
      
      toast({
        title: 'Success',
        description: 'Document created successfully',
      })
      
      // Reset form
      setNewDocumentName('')
      setNewDocumentType('')
      setNewDocumentContent('')
      setStartDate('')
      setEndDate('')
      setIsCreating(false)
      
      await loadDocuments()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create document',
        variant: 'destructive',
      })
    }
  }

  const handleSendDocument = async (document: Document) => {
    if (!clientEmail) {
      toast({
        title: 'Error',
        description: 'Client email not available',
        variant: 'destructive',
      })
      return
    }

    // Ask for confirmation before sending
    const confirmed = confirm(
      `Send "${document.documentName}" to ${clientName} at ${clientEmail}?\n\nThis will email the document as a PDF attachment.`
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch('/api/send-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          clientEmail: clientEmail,
          clientName: clientName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      toast({
        title: 'Email Sent!',
        description: `Document "${document.documentName}" has been sent to ${clientEmail}`,
      })
    } catch (error) {
      console.error('Error sending document:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send document',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to download document')
      }

      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = globalThis.document.createElement('a')
      link.href = url
      link.download = `${document.documentName}.pdf`
      
      // Trigger the download
      globalThis.document.body.appendChild(link)
      link.click()
      
      // Clean up
      globalThis.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download document error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download document',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  // Filter documents based on search term and document type
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.documentType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !documentTypeFilter || documentTypeFilter === 'all' || document.documentType === documentTypeFilter
    return matchesSearch && matchesType
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Documents for {clientName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-[70vh]">
          {/* Documents List */}
          <div className="w-1/3 border-r pr-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Documents</h3>
              <div className="flex gap-2">
                {documents.length > 0 && (
                  <Button 
                    onClick={handleDeleteAllDocuments}
                    variant="outline"
                    className={`transition-all duration-200 ${
                      showDeleteAllConfirm 
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50' 
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } shadow-sm`}
                    size="sm"
                    title="Delete all documents"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {showDeleteAllConfirm ? 'Click to Confirm' : 'Delete All'}
                  </Button>
                )}
                {isCreating ? (
                  <Button size="sm" onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Save
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            {documents.length > 0 && (
              <div className="space-y-3 mb-4">
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
                      <SelectItem value="diet">Diet Plan</SelectItem>
                      <SelectItem value="workout">Workout Plan</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="notes">Notes</SelectItem>
                      <SelectItem value="plan">General Plan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                        Type: {documentTypeFilter === 'diet' ? 'Diet Plan' : 
                               documentTypeFilter === 'workout' ? 'Workout Plan' :
                               documentTypeFilter === 'assessment' ? 'Assessment' :
                               documentTypeFilter === 'notes' ? 'Notes' :
                               documentTypeFilter === 'plan' ? 'General Plan' : 'Other'}
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
            
            <div className="space-y-2 overflow-y-auto max-h-[calc(70vh-60px)]">
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
                    onClick={() => handleViewDocument(doc)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{doc.documentName}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{doc.documentType}</p>
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
                                handleEditDocumentDirect(doc)
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
                                handleDeleteDocument(doc)
                              }}
                              title="Delete Document"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {/* Bottom row: Download and Send */}
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadDocument(doc)
                              }}
                              title="Download document as PDF"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {!clientEmail ? (
                              <div title="Add client's email address to enable sending">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={true}
                                  className="cursor-not-allowed"
                                >
                                  <Send className="h-3 w-3 text-gray-400" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSendDocument(doc)
                                }}
                                title="Send document to client via email"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 flex flex-col">
            {isCreating ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Create New Document</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="docName">Document Name *</Label>
                    <Input
                      id="docName"
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                      placeholder="Enter document name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="docType">Document Type *</Label>
                    <Select value={newDocumentType} onValueChange={setNewDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diet">Diet Plan</SelectItem>
                        <SelectItem value="workout">Workout Plan</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="notes">Notes</SelectItem>
                        <SelectItem value="plan">General Plan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newDocumentContent}
                    onChange={(e) => setNewDocumentContent(e.target.value)}
                    placeholder="Enter document content..."
                    className="min-h-[300px] resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateDocument} className="bg-blue-500 hover:bg-blue-600 text-white">
                    Create Document
                  </Button>
                </div>
              </div>
            ) : selectedDocument ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold">{selectedDocument.documentName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedDocument.documentType}</p>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDocument} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false)
                        setEditedContent(documentContent)
                        setEditedDocumentName(selectedDocument.documentName)
                      }}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="flex flex-col flex-1 space-y-4">
                    {/* Document Name Input */}
                    <div className="space-y-2">
                      <Label htmlFor="documentName">Document Name</Label>
                      <Input
                        id="documentName"
                        value={editedDocumentName}
                        onChange={(e) => setEditedDocumentName(e.target.value)}
                        placeholder="Enter document name"
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        This name will be used to save the document. You can edit it before saving.
                      </p>
                    </div>
                    
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 resize-none"
                      placeholder="Enter document content..."
                    />
                  </div>
                ) : (
                  <div className="flex-1 border border-blue-200 dark:border-blue-800 rounded-md p-4 overflow-y-auto bg-blue-50/20 dark:bg-blue-950/10">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          // Custom styling for code blocks
                          code: ({ node, inline, className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <code
                                className={`${className} block bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto text-sm`}
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <code
                                className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          },
                          // Custom styling for blockquotes
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-950/20 py-2 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          // Custom styling for tables
                          table: ({ children }) => (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                {children}
                              </table>
                            </div>
                          )
                        }}
                      >
                        {documentContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-muted-foreground">Select a document to view its content</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 