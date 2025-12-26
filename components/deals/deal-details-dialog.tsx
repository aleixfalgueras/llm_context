'use client'

import { useTranslations } from '@/lib/translations/context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit2, ExternalLink, Trash2, ImageIcon } from 'lucide-react'
import { Deal } from '@prisma/client'
import { format } from 'date-fns'
import Image from 'next/image'

interface DealDetailsDialogProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isOwner?: boolean
  onEdit?: (deal: Deal) => void
  onDelete?: (deal: Deal) => void
}

export function DealDetailsDialog({
  deal,
  open,
  onOpenChange,
  isOwner = false,
  onEdit,
  onDelete
}: DealDetailsDialogProps) {
  const t = useTranslations('deals')

  if (!deal) return null

  const isExpired = deal.validUntil && new Date(deal.validUntil) < new Date()
  const isComingSoon = deal.validFrom && new Date(deal.validFrom) > new Date()

  const handleExternalClick = (): void => {
    window.open(deal.externalUrl, '_blank', 'noopener,noreferrer')
  }

  const handleEdit = (): void => {
    onEdit?.(deal)
    onOpenChange(false)
  }

  const handleDelete = (): void => {
    onDelete?.(deal)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-cian">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mt-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo */}
              {deal.logoUrl && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={deal.logoUrl}
                    alt={`${deal.title} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">{deal.title}</DialogTitle>
              </div>
            </div>
            {/* Category and Price badges stacked vertically */}
            <div className="flex flex-col gap-2 items-end shrink-0">
              <Badge variant="outline" className="text-sm">
                {t(`dealCategories.${deal.category}`)}
              </Badge>
              <Badge variant="secondary" className="text-sm font-semibold">
                {deal.price}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Deal Image */}
          {deal.imageUrl ? (
            <div className="relative w-full h-64 overflow-hidden rounded-lg border">
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative w-full h-64 bg-muted flex items-center justify-center rounded-lg border">
              <ImageIcon className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {!deal.isApproved && isOwner && (
              <Badge variant="outline" className="text-xs text-amber-600">
                {t('status.pendingApproval')}
              </Badge>
            )}
            {isExpired && (
              <Badge variant="outline" className="text-xs text-red-600">
                {t('validation.expired')}
              </Badge>
            )}
            {isComingSoon && (
              <Badge variant="outline" className="text-xs text-blue-600">
                {t('validation.comingSoon')}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">{t('form.description')}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {deal.description}
            </p>
          </div>

          {/* Date Information */}
          {(deal.validFrom || deal.validUntil) && (
            <div className="space-y-1 text-sm text-muted-foreground">
              {deal.validFrom && (
                <div>{t('validation.validFrom', { date: format(new Date(deal.validFrom), 'PP') })}</div>
              )}
              {deal.validUntil && (
                <div>{t('validation.validUntil', { date: format(new Date(deal.validUntil), 'PP') })}</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            onClick={handleExternalClick}
            className="flex-1 bg-lavanda text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('actions.checkWebsite')}
          </Button>

          {isOwner && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 sm:flex-initial"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t('actions.edit')}
              </Button>

              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 sm:flex-initial text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('actions.delete')}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
