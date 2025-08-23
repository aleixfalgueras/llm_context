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

interface DeleteClientDialogProps {
  onDelete: () => void
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteClientDialog({ onDelete, clientName, open, onOpenChange }: DeleteClientDialogProps) {
  const t = useTranslations('clients')
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
            {t('delete.message', { name: clientName })}
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