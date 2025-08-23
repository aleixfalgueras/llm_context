'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {Trash2} from 'lucide-react'

interface DeletePromptDialogProps {
  onDelete: () => void
  promptName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePromptDialog({ onDelete, promptName, open, onOpenChange }: DeletePromptDialogProps) {
  const t = useTranslations('prompts')
  const tCommon = useTranslations('common')

  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('delete.title')}</DialogTitle>
          <DialogDescription>
            {t('delete.message', { name: promptName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            {tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 