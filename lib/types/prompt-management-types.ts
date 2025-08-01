export interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

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

export interface PromptActionHandlers {
  onEdit: (prompt: Prompt) => void
  onDelete: (promptId: string) => void
  onToggleStatus: (prompt: Prompt) => void
}

export interface FilterActionHandlers {
  onSearchChange: (search: string) => void
  onCategoryChange: (category: string) => void
  onSortChange: (sort: string) => void
  onToggleInactive: () => void
  onToggleTemplates: () => void
}

export const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'analysis', label: 'Analysis' },
]

export const SORT_OPTIONS = [
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'created', label: 'Recently Created' },
] 