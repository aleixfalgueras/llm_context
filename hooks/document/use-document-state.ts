'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { DOCUMENT_TYPES } from '@/lib/types/document-types'
import { Document } from '@/lib/types/component-types'

export function useDocumentState(clientId: string, open: boolean, documentToHighlight?: string | null) {
  const { toast } = useToast()
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentContent, setDocumentContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editedDocumentName, setEditedDocumentName] = useState('')
  
  // Create state
  const [isCreating, setIsCreating] = useState(false)
  const [newDocumentName, setNewDocumentName] = useState('')
  const [newDocumentContent, setNewDocumentContent] = useState('')
  const [newDocumentType, setNewDocumentType] = useState<string>(DOCUMENT_TYPES.MANUAL)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clientId })
      const response = await fetch(`/api/documents?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch client documents')
      }

      const result = await response.json()
      
      // Handle DbOperationResult structure
      const docs = result.data?.records || result.records || result.data || result || []
      
      setDocuments(Array.isArray(docs) ? docs : [])
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

  // Consolidated document content loading function
  const loadDocumentContent = async (document: Document, enableEditing = false) => {
    console.log('Loading document content for:', document.documentName, 'ID:', document.id)
    setLoadingContent(true)
    
    try {
      const response = await fetch(`/api/documents/${document.id}/content`)

      if (!response.ok) {
        throw new Error('Failed to fetch document content')
      }

      const result = await response.json()
      const content = result.data.content
      
      // Update all related state atomically
      setDocumentContent(content)
      setSelectedDocument(document)
      setEditedContent(content)
      setEditedDocumentName(document.documentName || '')
      setIsEditing(enableEditing)
      setIsCreating(false)
      
      console.log('Document state updated successfully')
    } catch (error) {
      console.error('Failed to load document content:', error)
      // Clear states on error
      setDocumentContent('')
      setEditedContent('')
      setEditedDocumentName('')
      
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    } finally {
      setLoadingContent(false)
    }
  }

  const handleViewDocument = async (document: Document) => {
    await loadDocumentContent(document, false)
  }

  const resetCreateState = () => {
    setIsCreating(false)
    setNewDocumentName('')
    setNewDocumentContent('')
    setNewDocumentType(DOCUMENT_TYPES.MANUAL)
  }

  // Reset all document-related state when dialog opens
  const resetAllState = () => {
    console.log('Resetting all document state')
    setSelectedDocument(null)
    setDocumentContent('')
    setIsEditing(false)
    setEditedContent('')
    setEditedDocumentName('')
    setIsCreating(false)
    setLoadingContent(false)
    resetCreateState()
  }

  const resetEditState = () => {
    if (selectedDocument) {
      setEditedContent(documentContent || '')
      setEditedDocumentName(selectedDocument.documentName || '')
    } else {
      setEditedContent('')
      setEditedDocumentName('')
    }
    setIsEditing(false)
  }

  useEffect(() => {
    if (open) {
      resetAllState()
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

  return {
    // Documents state
    documents,
    setDocuments,
    loading,
    loadingContent,
    selectedDocument,
    setSelectedDocument,
    documentContent,
    setDocumentContent,
    
    // Edit state
    isEditing,
    setIsEditing,
    editedContent,
    setEditedContent,
    editedDocumentName,
    setEditedDocumentName,
    
    // Create state
    isCreating,
    setIsCreating,
    newDocumentName,
    setNewDocumentName,
    newDocumentContent,
    setNewDocumentContent,
    newDocumentType,
    setNewDocumentType,
    
    // Actions
    loadDocuments,
    handleViewDocument,
    loadDocumentContent,
    resetCreateState,
    resetEditState,
    resetAllState,
  }
} 