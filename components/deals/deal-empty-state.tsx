'use client'

import { useTranslations } from '@/lib/translations/context'
import { Button } from '@/components/ui/button'
import { Plus, Tag } from 'lucide-react'

interface DealEmptyStateProps {
  isMyDeals?: boolean
  onCreateDeal?: () => void
}

export function DealEmptyState({ isMyDeals = false, onCreateDeal }: DealEmptyStateProps) {
  const t = useTranslations('deals')

  if (isMyDeals) {
    return (
      <div className="text-center py-12 px-4">
        <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('noDealstitle')}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t('noDealsDescription')}
        </p>
        {onCreateDeal && (
          <Button onClick={onCreateDeal} variant="blue">
            <Plus className="w-4 h-4 mr-2" />
            {t('createDeal')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-12 px-4">
      <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('noPublicDealsTitle')}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {t('noPublicDealsDescription')}
      </p>
    </div>
  )
}