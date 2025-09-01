import {Prompt, PromptCategory} from '@prisma/client'

export type PromptInput = Omit<Prompt, 'userId' | 'createdAt' | 'updatedAt'>

export interface PromptStats {
  total: number
  active: number
  mostUsed: Prompt | null
}

export interface PromptFilters {
  searchTerm: string
  selectedCategory: string
  sortBy: string
  showInactive: boolean
  showTemplates: boolean
}

export interface PromptFilterActionHandlers {
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onSortChange: (sort: string) => void
  onToggleInactive: () => void
  onToggleTemplates: () => void
}

// Export the Prisma enum
export type { PromptCategory }

// All prompt categories for iteration
export const ALL_PROMPT_CATEGORIES: PromptCategory[] = [
  PromptCategory.general,
  PromptCategory.marketing,
  PromptCategory.content,
  PromptCategory.analysis,
]

// Utility function to get categories with labels for selects/filters
export function getPromptCategoriesWithLabels(t: any, includeAll: boolean = false) {
  const categories = ALL_PROMPT_CATEGORIES.map(category => ({
    value: category,
    label: t(`categories.${category}`)
  }))
  
  if (includeAll) {
    return [
      { value: 'all', label: t('filters.allCategories') },
      ...categories
    ]
  }
  
  return categories
}

export const PROMPT_SORT_OPTIONS = [
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'created', label: 'Recently Created' },
]

export type SamplePrompt = Omit<Prompt, 'userId' | 'createdAt' | 'updatedAt'> & {
  isSample: true
}