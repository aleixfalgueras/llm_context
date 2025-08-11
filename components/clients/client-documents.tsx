'use client'

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {DocumentList} from '@/components/documents/document-list'
import {DocumentViewer} from '@/components/documents/document-viewer'
import {DocumentCreationForm} from '@/components/documents/document-creation-form'
import {DocumentPreviewDialog} from '@/components/documents/document-preview-dialog'
import {useDocumentState} from '@/hooks/document/use-document-state'
import {useDocumentOperations} from '@/hooks/document/use-document-operations'
import {useDocumentUIState} from '@/hooks/document/use-document-ui-state'

import {useToast} from '@/hooks/use-toast'
import type {ClientDocumentsProps, Document} from '@/lib/types/client-document-types'

export function ClientDocuments({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange, 
  documentToHighlight 
}: ClientDocumentsProps) {
  const { toast } = useToast()
  
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
    await documentState.loadDocumentContent(document, true)
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
    documentState.setIsCreating(true)
    documentState.setIsEditing(false)
    documentState.setSelectedDocument(null)
  }

  const handleCreateDocument = async () => {
    await operations.handleCreateDocument(
      documentState.newDocumentName,
      documentState.newDocumentType,
      documentState.newDocumentContent
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
          <DialogDescription>
            View, edit, and manage documents for this client
          </DialogDescription>
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
                  isCreating={documentState.isCreating}
                  isCreatingDocument={operations.isCreatingDocument}
                  hideDocumentType={true}
                  onNameChange={documentState.setNewDocumentName}
                  onContentChange={documentState.setNewDocumentContent}
                  onTypeChange={documentState.setNewDocumentType}
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
                loadingContent={documentState.loadingContent}
                isSaving={operations.isSavingDocument}
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

    </Dialog>
  )
} 