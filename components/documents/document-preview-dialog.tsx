'use client'

import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Eye} from 'lucide-react'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {useTranslations} from '@/lib/translations/context'

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
  onConfirm?: () => void
  confirmText?: string
  showConfirm?: boolean
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  title,
  content,
  onConfirm,
  confirmText,
  showConfirm = true
}: DocumentPreviewDialogProps) {
  const t = useTranslations('documents')
  const tCommon = useTranslations('common')
  const defaultConfirmText = confirmText || tCommon('confirm')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Preview: {title || 'Untitled'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto max-h-[70vh] border border-blue-200 dark:border-blue-800 rounded-md p-4 bg-blue-50/20 dark:bg-blue-950/10">
          <MarkdownRenderer content={content || t('preview.noContent')} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('preview.closePreview')}
          </Button>
          {showConfirm && onConfirm && (
            <Button 
              onClick={() => {
                onOpenChange(false)
                onConfirm()
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!title?.trim() || !content?.trim()}
            >
              {defaultConfirmText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 