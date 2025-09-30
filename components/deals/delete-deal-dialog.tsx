'use client'

import { useTranslations } from '@/lib/translations/context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Deal } from '@prisma/client'

interface DeleteDealDialogProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteDealDialog({
  deal,
  open,
  onOpenChange,
  onConfirm,
  isDeleting
}: DeleteDealDialogProps) {
  const t = useTranslations('deals')

  if (!deal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteDeal')}</DialogTitle>
          <DialogDescription>
            {t('actions.confirmDelete')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm">
            <span className="font-semibold">{deal.title}</span>
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '...' : t('actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}