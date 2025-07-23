'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Eye, Plus, X} from 'lucide-react'
import {DOCUMENT_TYPES, type DocumentType, getDocumentTypeLabel} from '@/types/document-types'

interface DocumentCreationFormProps {
  documentName: string
  documentContent: string
  documentType: string
  isCreating: boolean
  isCreatingDocument?: boolean
  hideDocumentType?: boolean
  onNameChange: (name: string) => void
  onContentChange: (content: string) => void
  onTypeChange: (type: string) => void
  onCreate: () => void
  onCancel: () => void
  onPreview: () => void
}

export function DocumentCreationForm({
  documentName,
  documentContent,
  documentType,
  isCreating,
  isCreatingDocument = false,
  hideDocumentType,
  onNameChange,
  onContentChange,
  onTypeChange,
  onCreate,
  onCancel,
  onPreview
}: DocumentCreationFormProps) {
  if (!isCreating) {
    return null
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Create New Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Name */}
        <div className="space-y-2">
          <Label htmlFor="newDocName">Document Name *</Label>
          <Input
            id="newDocName"
            placeholder="Enter document name"
            value={documentName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        {/* Document Type */}
        {!hideDocumentType && (
          <div className="space-y-2">
            <Label htmlFor="newDocType">Document Type *</Label>
            <Select value={documentType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DOCUMENT_TYPES).map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {getDocumentTypeLabel(type as DocumentType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        {/* Document Content */}
        <div className="space-y-2">
          <Label htmlFor="newDocContent">Content *</Label>
          <Textarea
            id="newDocContent"
            placeholder="Enter document content..."
            value={documentContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            You can use Markdown formatting for rich text content.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            disabled={!documentName.trim() || !documentContent.trim()}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            onClick={onCreate}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!documentName.trim() || !documentContent.trim() || (!hideDocumentType && !documentType) || isCreatingDocument}
          >
            {isCreatingDocument ? (
              <LoadingSpinner size="sm" text="Creating..." className="text-white" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Create Document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 