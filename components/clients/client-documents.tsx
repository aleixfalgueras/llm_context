'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { DocumentList } from '@/components/documents/document-list'
import { DocumentViewer } from '@/components/documents/document-viewer'
import { DocumentCreationForm } from '@/components/documents/document-creation-form'
import { DocumentPreviewDialog } from '@/components/documents/document-preview-dialog'
import { useDocumentState } from '@/hooks/use-document-state'
import { useDocumentOperations } from '@/hooks/use-document-operations'
import { useDocumentUIState } from '@/hooks/use-document-ui-state'
import { getDocumentContent } from '@/lib/document-actions'
import { checkCanCreateDocument } from '@/lib/document-usage-utils'
import { useToast } from '@/hooks/use-toast'
import type { ClientDocumentsProps, Document } from '@/types/client-document-types'

export function ClientDocuments({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange, 
  documentToHighlight 
}: ClientDocumentsProps) {
  const { toast } = useToast()
  
  // State for document limit dialog
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
  
  // Custom hooks for state management
  const documentState = useDocumentState(clientId, open, documentToHighlight)
  const uiState = useDocumentUIState()
  
  // Custom hook for operations
  const operations = useDocumentOperations({
    clientId,
    clientName,
    loadDocuments: documentState.loadDocuments,
    resetCreateState: documentState.resetCreateState,
    resetEditState: documentState.resetEditState,
    setSelectedDocument: documentState.setSelectedDocument,
    setDocumentContent: documentState.setDocumentContent,
    setDocuments: documentState.setDocuments,
  })

  // Document editing handlers
  const handleEditDocument = async (document: Document) => {
    try {
      const content = await getDocumentContent(document.documentPath)
      documentState.setDocumentContent(content)
      documentState.setSelectedDocument(document)
      documentState.setEditedContent(content)
      documentState.setEditedDocumentName(document.documentName)
      documentState.setIsEditing(true)
      documentState.setIsCreating(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document content',
        variant: 'destructive',
      })
    }
  }

  const handleEditMode = () => {
    if (documentState.selectedDocument) {
      documentState.setEditedDocumentName(documentState.selectedDocument.documentName)
    }
    documentState.setIsEditing(true)
  }

  const handleSaveDocument = async () => {
    if (!documentState.selectedDocument) return
    
    const success = await operations.handleEditDocument(
      documentState.selectedDocument,
      documentState.editedDocumentName,
      documentState.editedContent,
      documentState.setDocumentContent
    )
    
    if (success) {
      documentState.setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    documentState.resetEditState()
  }

  // Document creation handlers
  const handleCreateNew = async () => {
    // Check document usage limits before allowing document creation
    const usageCheck = await checkCanCreateDocument()
    
    if (!usageCheck.allowed && usageCheck.message) {
      setLimitMessage(usageCheck.message)
      setShowLimitDialog(true)
      return
    }
    
    // Proceed with document creation
    documentState.setIsCreating(true)
    documentState.setIsEditing(false)
    documentState.setSelectedDocument(null)
  }

  const handleCreateDocument = async () => {
    await operations.handleCreateDocument(
      documentState.newDocumentName,
      documentState.newDocumentType,
      documentState.newDocumentContent,
      documentState.startDate,
      documentState.endDate
    )
  }

  // Wrapper functions for operations that need additional parameters
  const handleDeleteDocument = (document: Document) => {
    operations.handleDeleteDocument(document, documentState.selectedDocument)
  }

  const handleDeleteAllDocuments = () => {
    operations.handleDeleteAllDocuments(
      documentState.documents,
      uiState.showDeleteAllConfirm,
      uiState.setShowDeleteAllConfirm
    )
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
            documents={documentState.documents}
            loading={documentState.loading}
            selectedDocument={documentState.selectedDocument}
            onViewDocument={documentState.handleViewDocument}
            onEditDocument={handleEditDocument}
            onDeleteDocument={handleDeleteDocument}
            onDeleteAllDocuments={handleDeleteAllDocuments}
            onDownloadDocument={operations.handleDownloadDocument}
            onCreateNew={handleCreateNew}
            showDeleteAllConfirm={uiState.showDeleteAllConfirm}
            setShowDeleteAllConfirm={uiState.setShowDeleteAllConfirm}
          />

          {/* Document Content */}
          <div className={`flex-1 flex flex-col ${documentState.isCreating ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {documentState.isCreating ? (
              <div className="p-4">
                <DocumentCreationForm
                  documentName={documentState.newDocumentName}
                  documentContent={documentState.newDocumentContent}
                  documentType={documentState.newDocumentType}
                  startDate={documentState.startDate}
                  endDate={documentState.endDate}
                  isCreating={documentState.isCreating}
                  hideDocumentType={true}
                  onNameChange={documentState.setNewDocumentName}
                  onContentChange={documentState.setNewDocumentContent}
                  onTypeChange={documentState.setNewDocumentType}
                  onStartDateChange={documentState.setStartDate}
                  onEndDateChange={documentState.setEndDate}
                  onCreate={handleCreateDocument}
                  onCancel={documentState.resetCreateState}
                  onPreview={() => uiState.setShowPreview(true)}
                />
              </div>
            ) : (
              <DocumentViewer
                document={documentState.selectedDocument}
                documentContent={documentState.documentContent}
                isEditing={documentState.isEditing}
                editedContent={documentState.editedContent}
                editedDocumentName={documentState.editedDocumentName}
                onEdit={handleEditMode}
                onSave={handleSaveDocument}
                onCancel={handleCancelEdit}
                onContentChange={documentState.setEditedContent}
                onNameChange={documentState.setEditedDocumentName}
                onPreview={() => uiState.setShowEditPreview(true)}
              />
            )}
          </div>
        </div>
      </DialogContent>

      {/* Preview Dialogs */}
      <DocumentPreviewDialog
        open={uiState.showPreview}
        onOpenChange={uiState.setShowPreview}
        title={documentState.newDocumentName}
        content={documentState.newDocumentContent}
        onConfirm={handleCreateDocument}
        confirmText="Create Document"
      />

      <DocumentPreviewDialog
        open={uiState.showEditPreview}
        onOpenChange={uiState.setShowEditPreview}
        title={documentState.editedDocumentName || documentState.selectedDocument?.documentName || ''}
        content={documentState.editedContent}
        onConfirm={handleSaveDocument}
        confirmText="Save Document"
      />

      {/* Document Limit Alert Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Document Limit Reached
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upgrade Required</AlertTitle>
            <AlertDescription>
              {limitMessage}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              Close
            </Button>
            <Button onClick={() => window.open('/pricing', '_blank')}>
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
} 