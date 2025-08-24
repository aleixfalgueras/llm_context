'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {FileText} from 'lucide-react'
import {PromptDialog} from '@/components/prompts/prompt-dialog'

interface PromptEmptyStateProps {
  searchTerm: string
  selectedCategory: string
  onRefresh: () => void
}

export function PromptEmptyState({ searchTerm, selectedCategory, onRefresh }: PromptEmptyStateProps) {
  const t = useTranslations('prompts')
  const hasFilters = searchTerm || selectedCategory !== 'all'
  
  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('emptyState.noPromptsFound')}</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters 
          ? t('emptyState.tryAdjustingFilters')
          : t('emptyState.getStartedMessage')
        }
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onRefresh}>
          {t('emptyState.clearFilters')}
        </Button>
      ) : (
        <PromptDialog 
          onSuccess={onRefresh}
          trigger={
            <Button variant="blue">
              {t('emptyState.createFirstPrompt')}
            </Button>
          }
        />
      )}
    </div>
  )
} 