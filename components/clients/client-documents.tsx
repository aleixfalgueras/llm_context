'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getClientDocuments, deleteDocument, deleteAllDocuments, getDocumentContent, updateDocumentNameAndContent, createDocument } from '@/lib/document-actions'
import { useToast } from '@/hooks/use-toast'
import { DocumentList } from '@/components/documents/document-list'
import { DocumentViewer } from '@/components/documents/document-viewer'
import { DocumentCreationForm } from '@/components/documents/document-creation-form'
import { DocumentPreviewDialog } from '@/components/documents/document-preview-dialog'
import { DOCUMENT_TYPES } from '@/types/document-types'

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

export function ClientDocuments({ 
  clientId, 
  clientName, 
  clientEmail, 
  open, 
  onOpenChange, 
  documentToHighlight 
}: ClientDocumentsProps) {
  const { toast } = useToast()
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentContent, setDocumentContent] = useState('')
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editedDocumentName, setEditedDocumentName] = useState('')
  
  // Create state
  const [isCreating, setIsCreating] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('')
  const [newDocumentContent, setNewDocumentContent] = useState('')
  const [newDocumentType, setNewDocumentType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // UI state
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditPreview, setShowEditPreview] = useState(false)

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
      setIsCreating(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    }
  }

  const handleEditDocument = async (document: Document) => {
    try {
      const content = await getDocumentContent(document.documentPath)
      setDocumentContent(content)
      setSelectedDocument(document)
      setEditedContent(content)
      setEditedDocumentName(document.documentName)
      setIsEditing(true)
      setIsCreating(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    }
  }

  const handleEditMode = () => {
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
      await loadDocuments()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      })
    }
  }

  const handleCancelEdit = () => {
    if (selectedDocument) {
      setEditedContent(documentContent)
      setEditedDocumentName(selectedDocument.documentName)
    }
    setIsEditing(false)
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
        await deleteAllDocuments(clientId)
        toast({
          title: 'Success',
          description: 'All documents deleted successfully',
        })
        setDocuments([])
        setSelectedDocument(null)
        setDocumentContent('')
        setShowDeleteAllConfirm(false)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete documents',
          variant: 'destructive',
        })
      }
    } else {
      setShowDeleteAllConfirm(true)
    }
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedDocument(null)
    setNewDocumentName('')
    setNewDocumentContent('')
    setNewDocumentType(DOCUMENT_TYPES.MANUAL)
    setStartDate('')
    setEndDate('')
  }

  const handleCreateDocument = async () => {
    if (!newDocumentName.trim() || !newDocumentContent.trim()) {
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

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewDocumentName('')
    setNewDocumentContent('')
    setNewDocumentType(DOCUMENT_TYPES.MANUAL)
    setStartDate('')
    setEndDate('')
  }

  // Download and send functions  
  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await fetch('/api/download-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Create blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${doc.documentName}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast({
        title: 'Download Started',
        description: `"${doc.documentName}" is being downloaded as PDF`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSendDocument = async (doc: Document) => {
    if (!clientEmail) {
      toast({
        title: 'Email Required',
        description: 'Client email address is required to send documents',
        variant: 'destructive',
      })
      return
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to send "${doc.documentName}" to ${clientEmail}?\n\nThis will email the document as a PDF attachment to the client.`
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
          documentId: doc.id,
          clientEmail,
          clientName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send document')
      }

      const result = await response.json()

      toast({
        title: 'Document Sent',
        description: `"${doc.documentName}" has been sent to ${clientEmail}`,
      })
    } catch (error) {
      console.error('Send error:', error)
      toast({
        title: 'Send Failed',
        description: 'Failed to send document. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Documents for {clientName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[80vh] gap-0">
          {/* Document List */}
          <DocumentList
            documents={documents}
            loading={loading}
            selectedDocument={selectedDocument}
            clientEmail={clientEmail}
            onViewDocument={handleViewDocument}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
            onDeleteAllDocuments={handleDeleteAllDocuments}
            onDownloadDocument={handleDownloadDocument}
            onSendDocument={handleSendDocument}
            onCreateNew={handleCreateNew}
            showDeleteAllConfirm={showDeleteAllConfirm}
            setShowDeleteAllConfirm={setShowDeleteAllConfirm}
          />

          {/* Document Content */}
          <div className={`flex-1 flex flex-col ${isCreating ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {isCreating ? (
              <div className="p-4">
                <DocumentCreationForm
                  documentName={newDocumentName}
                  documentContent={newDocumentContent}
                  documentType={newDocumentType}
                  startDate={startDate}
                  endDate={endDate}
                  isCreating={isCreating}
                  hideDocumentType={true}
                  onNameChange={setNewDocumentName}
                  onContentChange={setNewDocumentContent}
                  onTypeChange={setNewDocumentType}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onCreate={handleCreateDocument}
                  onCancel={handleCancelCreate}
                  onPreview={() => setShowPreview(true)}
                />
              </div>
            ) : (
              <DocumentViewer
                document={selectedDocument}
                documentContent={documentContent}
                isEditing={isEditing}
                editedContent={editedContent}
                editedDocumentName={editedDocumentName}
                onEdit={handleEditMode}
                onSave={handleSaveDocument}
                onCancel={handleCancelEdit}
                onContentChange={setEditedContent}
                onNameChange={setEditedDocumentName}
                onPreview={() => setShowEditPreview(true)}
              />
            )}
          </div>
        </div>
      </DialogContent>

      {/* Preview Dialogs */}
      <DocumentPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        title={newDocumentName}
        content={newDocumentContent}
        onConfirm={handleCreateDocument}
        confirmText="Create Document"
      />

      <DocumentPreviewDialog
        open={showEditPreview}
        onOpenChange={setShowEditPreview}
        title={editedDocumentName || selectedDocument?.documentName || ''}
        content={editedContent}
        onConfirm={handleSaveDocument}
        confirmText="Save Document"
      />
    </Dialog>
  )
} 