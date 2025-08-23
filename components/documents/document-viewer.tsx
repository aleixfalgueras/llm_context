'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Edit, Eye, FileText, Loader2, Save, X} from 'lucide-react'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {type DocumentType, getDocumentTypeLabel} from '@/lib/types/document-types'
import {Document} from '@prisma/client'
import {useTranslations} from '@/lib/translations/context'

interface DocumentViewerProps {
  document: Document | null
  documentContent: string
  isEditing: boolean
  editedContent: string
  editedDocumentName: string
  loadingContent?: boolean
  isSaving?: boolean
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
  loadingContent = false,
  isSaving = false,
  onEdit,
  onSave,
  onCancel,
  onContentChange,
  onNameChange,
  onPreview
}: DocumentViewerProps) {
  const t = useTranslations('documents')
  const tCommon = useTranslations('common')
  
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-muted-foreground">{t('viewer.selectDocument')}</p>
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
              placeholder="Enter document name"
            />
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{document.documentName}</h2>
              <p className="text-sm text-muted-foreground">{getDocumentTypeLabel(document.documentType as DocumentType)}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                disabled={!editedContent?.trim()}
              >
                <Eye className="h-4 w-4 mr-1" />
                {tCommon('preview')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-1" />
                {tCommon('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={!editedDocumentName?.trim() || !editedContent?.trim() || isSaving}
                variant="blue"
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" text={tCommon('saving')} className="text-white" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {tCommon('save')}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onEdit} variant="blue">
              <Edit className="h-4 w-4 mr-1" />
              {tCommon('edit')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <Textarea
                value={editedContent}
                onChange={(e) => onContentChange(e.target.value)}
                className="w-full h-full resize-none text-sm"
                placeholder={t('form.contentPlaceholderEditor')}
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {loadingContent ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('viewer.loadingContent')}</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <MarkdownRenderer content={documentContent || ''} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 