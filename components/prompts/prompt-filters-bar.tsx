'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Eye, EyeOff, Lightbulb, Search} from 'lucide-react'
import {CATEGORIES, FilterActionHandlers, PromptFilters, SORT_OPTIONS} from '@/lib/types/prompt-management-types'

interface PromptFiltersBarProps {
  filters: PromptFilters
  actionHandlers: FilterActionHandlers
}

export function PromptFiltersBar({ filters, actionHandlers }: PromptFiltersBarProps) {
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
            placeholder="Search prompts..."
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
          {CATEGORIES.map((category) => (
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
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
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
            Hide Inactive
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Show All
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
            Hide Templates
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4 mr-2" />
            Show Templates
          </>
        )}
      </Button>
    </div>
  )
} 