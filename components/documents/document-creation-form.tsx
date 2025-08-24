'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Eye, Plus, X} from 'lucide-react'
import {ALL_DOCUMENT_TYPES, type DocumentType, getDocumentTypeLabel} from '@/lib/types/document-types'
import {useTranslations} from '@/lib/translations/context'

interface DocumentCreationFormProps {
  documentName: string
  documentContent: string
  documentType: DocumentType
  isCreating: boolean
  isCreatingDocument?: boolean
  hideDocumentType?: boolean
  onNameChange: (name: string) => void
  onContentChange: (content: string) => void
  onTypeChange: (type: DocumentType) => void
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
  const t = useTranslations('documents')
  const tCommon = useTranslations('common')
  if (!isCreating) {
    return null
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {t('form.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Name */}
        <div className="space-y-2">
          <Label htmlFor="newDocName">{t('form.documentNameLabel')}</Label>
          <Input
            id="newDocName"
            placeholder={t("form.documentNamePlaceholder")}
            value={documentName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        {/* Document Type */}
        {!hideDocumentType && (
          <div className="space-y-2">
            <Label htmlFor="newDocType">{t('form.documentTypeLabel')}</Label>
            <Select value={documentType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("form.documentTypePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {ALL_DOCUMENT_TYPES.map((type: DocumentType) => (
                  <SelectItem key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


        {/* Document Content */}
        <div className="space-y-2">
          <Label htmlFor="newDocContent">{t('form.contentLabel')}</Label>
          <Textarea
            id="newDocContent"
            placeholder={t("form.documentContentPlaceholder")}
            value={documentContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[150px] text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('form.markdownHelp')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            {tCommon('cancel')}
          </Button>
          <Button
            variant="outline"
            onClick={onPreview}
            disabled={!documentName.trim() || !documentContent.trim()}
          >
            <Eye className="h-4 w-4 mr-1" />
            {tCommon('preview')}
          </Button>
          <Button
            onClick={onCreate}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!documentName.trim() || !documentContent.trim() || (!hideDocumentType && !documentType) || isCreatingDocument}
          >
            {isCreatingDocument ? (
              <LoadingSpinner size="sm" text={tCommon('creating')} className="text-white" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                {t('actions.createDocument')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 