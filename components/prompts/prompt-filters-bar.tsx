'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Eye, EyeOff, Lightbulb, Search} from 'lucide-react'
import {getPromptCategoriesWithLabels, PromptFilterActionHandlers, PromptFilters, PROMPT_SORT_OPTIONS} from '@/lib/types/prompt-types'

interface PromptFiltersBarProps {
  filters: PromptFilters
  actionHandlers: PromptFilterActionHandlers
}

export function PromptFiltersBar({ filters, actionHandlers }: PromptFiltersBarProps) {
  const t = useTranslations('prompts')
  const {
    searchTerm,
    selectedCategory,
    sortBy,
    showInactive,
    showTemplates
  } = filters

  const {
    onSearchChange,
    onCategoryChange,
    onSortChange,
    onToggleInactive,
    onToggleTemplates
  } = actionHandlers

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getPromptCategoriesWithLabels(t, true).map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROMPT_SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`filters.sort.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        onClick={onToggleInactive}
        className="w-full sm:w-auto"
      >
        {showInactive ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            {t('hideInactive')}
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            {t('showAll')}
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        onClick={onToggleTemplates}
        className="w-full sm:w-auto"
      >
        {showTemplates ? (
          <>
            <Lightbulb className="w-4 h-4 mr-2" />
            {t('hideTemplates')}
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4 mr-2" />
            {t('showTemplates')}
          </>
        )}
      </Button>
    </div>
  )
} 