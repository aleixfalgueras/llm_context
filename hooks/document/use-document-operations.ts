'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ToastVariant } from '@/types/enums'
import { Document } from '@/types/component-types'

interface UseDocumentOperationsProps {
  clientId: string
  clientName: string
  loadDocuments: () => Promise<void>
  resetCreateState: () => void
  resetEditState: () => void
  setSelectedDocument: (doc: Document | null) => void
  setDocumentContent: (content: string) => void
  setDocuments: (docs: Document[]) => void
}

export function useDocumentOperations({
  clientId,
  loadDocuments,
  resetCreateState,
  setSelectedDocument,
  setDocumentContent,
  setDocuments,
}: UseDocumentOperationsProps) {
  const { toast } = useToast()
  const [isCreatingDocument, setIsCreatingDocument] = useState(false)

  const handleCreateDocument = async (
    documentName: string,
    documentType: string,
    documentContent: string
  ) => {
    if (!documentName.trim() || !documentContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: ToastVariant.DESTRUCTIVE,
      })
      return false
    }

    setIsCreatingDocument(true)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          documentName,
          documentType,
          content: documentContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create document')
      }

      await response.json()
      toast({
        title: 'Success',
        description: 'Document created successfully',
      })
      resetCreateState()
      await loadDocuments()
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document'
      
      // Check for storage limit errors
      if (errorMessage.includes('Storage limit exceeded')) {
        toast({
          title: 'Storage Limit Exceeded',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
      return false
    } finally {
      setIsCreatingDocument(false)
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

    if (!editedContent.trim()) {
      toast({
        title: 'Error',
        description: 'Document content cannot be empty',
        variant: 'destructive',
      })
      return false
    }

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentName: editedDocumentName,
          content: editedContent
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update document')
      }

      await response.json()
      
      setDocumentContent(editedContent)
      setSelectedDocument({ ...selectedDocument, documentName: editedDocumentName })
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      })
      await loadDocuments()
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document'
      
      // Check for storage limit errors
      if (errorMessage.includes('Storage limit exceeded')) {
        toast({
          title: 'Storage Limit Exceeded',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
      return false
    }
  }

  const handleDeleteDocument = async (document: Document, selectedDocument: Document | null) => {
    if (!confirm(`Are you sure you want to delete "${document.documentName}"? This action cannot be undone.`)) {
      return false
    }

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      await response.json()
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
        const response = await fetch('/api/documents/delete-all', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId })
        })

        if (!response.ok) {
          throw new Error('Failed to delete all documents')
        }

        await response.json()
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
      const response = await fetch(`/api/documents/${doc.id}/download`)

      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      // Create blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${doc.documentName}.md`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast({
        title: 'Download Started',
        description: `"${doc.documentName}" is being downloaded as Markdown`,
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



  return {
    handleCreateDocument,
    handleEditDocument,
    handleDeleteDocument,
    handleDeleteAllDocuments,
    handleDownloadDocument,
    isCreatingDocument,
  }
} 