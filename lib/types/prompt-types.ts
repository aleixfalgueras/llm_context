import {Prompt} from '@prisma/client'

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

export const PROMPT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'analysis', label: 'Analysis' },
]

export const PROMPT_SORT_OPTIONS = [
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'created', label: 'Recently Created' },
]

export type SamplePrompt = Omit<Prompt, 'userId' | 'createdAt' | 'updatedAt'> & {
  isSample: true
}