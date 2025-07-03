'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { DOCUMENT_TYPES } from '@/types/document-types'
import { Document } from '@/types/component-types'

export function useDocumentState(clientId: string, open: boolean, documentToHighlight?: string | null) {
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
  const [newDocumentType, setNewDocumentType] = useState<string>(DOCUMENT_TYPES.MANUAL)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents?clientId=${encodeURIComponent(clientId)}`)

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

  const handleViewDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/content`)

      if (!response.ok) {
        throw new Error('Failed to load document content')
      }

      const { content } = await response.json()
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

  const resetCreateState = () => {
    setIsCreating(false)
    setNewDocumentName('')
    setNewDocumentContent('')
    setNewDocumentType(DOCUMENT_TYPES.MANUAL)
    setStartDate('')
    setEndDate('')
  }

  const resetEditState = () => {
    if (selectedDocument) {
      setEditedContent(documentContent)
      setEditedDocumentName(selectedDocument.documentName)
    }
    setIsEditing(false)
  }

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

  return {
    // Documents state
    documents,
    setDocuments,
    loading,
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
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    
    // Actions
    loadDocuments,
    handleViewDocument,
    resetCreateState,
    resetEditState,
  }
} 