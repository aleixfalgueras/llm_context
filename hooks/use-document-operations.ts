'use client'

import { deleteDocument, deleteAllDocuments, updateDocumentNameAndContent, createDocument } from '@/lib/document-actions'
import { useToast } from '@/hooks/use-toast'

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

interface UseDocumentOperationsProps {
  clientId: string
  clientName: string
  clientEmail?: string
  loadDocuments: () => Promise<void>
  resetCreateState: () => void
  resetEditState: () => void
  setSelectedDocument: (doc: Document | null) => void
  setDocumentContent: (content: string) => void
  setDocuments: (docs: Document[]) => void
}

export function useDocumentOperations({
  clientId,
  clientName,
  clientEmail,
  loadDocuments,
  resetCreateState,
  resetEditState,
  setSelectedDocument,
  setDocumentContent,
  setDocuments,
}: UseDocumentOperationsProps) {
  const { toast } = useToast()

  const handleCreateDocument = async (
    documentName: string,
    documentType: string,
    documentContent: string,
    startDate?: string,
    endDate?: string
  ) => {
    if (!documentName.trim() || !documentContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return false
    }

    try {
      await createDocument(
        clientId,
        documentName,
        documentType,
        documentContent,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
      toast({
        title: 'Success',
        description: 'Document created successfully',
      })
      resetCreateState()
      await loadDocuments()
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create document',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleEditDocument = async (
    selectedDocument: Document,
    editedDocumentName: string,
    editedContent: string,
    setDocumentContent: (content: string) => void
  ) => {
    if (!editedDocumentName.trim()) {
      toast({
        title: 'Error',
        description: 'Document name cannot be empty',
        variant: 'destructive',
      })
      return false
    }

    try {
      await updateDocumentNameAndContent(selectedDocument.id, editedDocumentName, editedContent)
      setDocumentContent(editedContent)
      setSelectedDocument({ ...selectedDocument, documentName: editedDocumentName })
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      })
      await loadDocuments()
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleDeleteDocument = async (document: Document, selectedDocument: Document | null) => {
    if (!confirm(`Are you sure you want to delete "${document.documentName}"? This action cannot be undone.`)) {
      return false
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
      return true
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleDeleteAllDocuments = async (documents: Document[], showDeleteAllConfirm: boolean, setShowDeleteAllConfirm: (show: boolean) => void) => {
    if (documents.length === 0) {
      toast({
        title: 'No documents',
        description: 'There are no documents to delete',
      })
      return false
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
        return true
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete documents',
          variant: 'destructive',
        })
        return false
      }
    } else {
      setShowDeleteAllConfirm(true)
      return false
    }
  }

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
      return true
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleSendDocument = async (doc: Document) => {
    if (!clientEmail) {
      toast({
        title: 'Email Required',
        description: 'Client email address is required to send documents',
        variant: 'destructive',
      })
      return false
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to send "${doc.documentName}" to ${clientEmail}?\n\nThis will email the document as a PDF attachment to the client.`
    )

    if (!confirmed) {
      return false
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

      toast({
        title: 'Document Sent',
        description: `"${doc.documentName}" has been sent to ${clientEmail}`,
      })
      return true
    } catch (error) {
      console.error('Send error:', error)
      toast({
        title: 'Send Failed',
        description: 'Failed to send document. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  return {
    handleCreateDocument,
    handleEditDocument,
    handleDeleteDocument,
    handleDeleteAllDocuments,
    handleDownloadDocument,
    handleSendDocument,
  }
} 