'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Edit, Save, X, Eye } from 'lucide-react'
import { MarkdownRenderer } from '@/components/global/markdown-renderer'
import { getDocumentTypeLabel, type DocumentType } from '@/types/document-types'
import { Document } from '@/types/component-types'

interface DocumentViewerProps {
  document: Document | null
  documentContent: string
  isEditing: boolean
  editedContent: string
  editedDocumentName: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onContentChange: (content: string) => void
  onNameChange: (name: string) => void
  onPreview: () => void
}

export function DocumentViewer({
  document,
  documentContent,
  isEditing,
  editedContent,
  editedDocumentName,
  onEdit,
  onSave,
  onCancel,
  onContentChange,
  onNameChange,
  onPreview
}: DocumentViewerProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-muted-foreground">Select a document to view its content</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedDocumentName}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-lg font-semibold bg-background"
              placeholder="Document name"
            />
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{document.documentName}</h2>
              <p className="text-sm text-muted-foreground">{getDocumentTypeLabel(document.documentType as DocumentType)}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                disabled={!editedContent.trim()}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={!editedDocumentName.trim() || !editedContent.trim()}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border bg-muted/5">
              <p className="text-sm text-muted-foreground">
                Edit your document content using Markdown. Use the preview button to see how it will look.
              </p>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={editedContent}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full resize-none font-mono text-sm"
                placeholder="Enter your document content here using Markdown..."
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <MarkdownRenderer content={documentContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 