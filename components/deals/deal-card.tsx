'use client'

import { useTranslations } from '@/lib/translations/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit2, ExternalLink, Trash2, ImageIcon } from 'lucide-react'
import { Deal } from '@prisma/client'
import { format } from 'date-fns'
import Image from 'next/image'

interface DealCardProps {
  deal: Deal
  isOwner?: boolean
  onEdit?: (deal: Deal) => void
  onDelete?: (deal: Deal) => void
}

export function DealCard({ deal, isOwner = false, onEdit, onDelete }: DealCardProps) {
  const t = useTranslations('deals')

  const isExpired = deal.validUntil && new Date(deal.validUntil) < new Date()
  const isComingSoon = deal.validFrom && new Date(deal.validFrom) > new Date()

  const handleExternalClick = () => {
    window.open(deal.externalUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Deal Image */}
      {deal.imageUrl ? (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <Image
            src={deal.imageUrl}
            alt={deal.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="relative w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
          <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      <CardHeader className="pb-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="truncate">{deal.title}</span>
            </CardTitle>
            <div className="h-12 flex items-start mt-2">
              <CardDescription className="text-sm leading-relaxed break-words overflow-hidden">
                {deal.description.length > 100
                  ? `${deal.description.substring(0, 100)}...`
                  : deal.description}
              </CardDescription>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            {deal.price}
          </Badge>
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

        {(deal.validFrom || deal.validUntil) && (
          <div className="text-xs text-muted-foreground mt-2">
            {deal.validFrom && (
              <div>{t('validation.validFrom', { date: format(new Date(deal.validFrom), 'PP') })}</div>
            )}
            {deal.validUntil && (
              <div>{t('validation.validUntil', { date: format(new Date(deal.validUntil), 'PP') })}</div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="default"
            size="sm"
            onClick={handleExternalClick}
            className="flex-1 mr-2"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('actions.viewExternal')}
          </Button>

          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(deal)}
                title={t('actions.edit')}
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(deal)}
                title={t('actions.delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}