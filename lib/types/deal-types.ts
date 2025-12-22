import { DealCategory } from '@prisma/client'

export interface DealFormData {
  title?: string
  description?: string
  price?: string
  category?: DealCategory
  externalUrl?: string
  imageFile?: File | null
  validFrom?: Date | null
  validUntil?: Date | null
  isActive?: boolean
}

export interface DealListFilters {
  searchTerm?: string
  isActive?: boolean
  isApproved?: boolean
  includeInactive?: boolean
}

// Export the Prisma enum
export type { DealCategory }

// All deal categories for iteration
export const ALL_DEAL_CATEGORIES: DealCategory[] = [
  DealCategory.CONFERENCE,
  DealCategory.ONLINE_COURSE,
  DealCategory.ONLINE_CONSULTANCY,
  DealCategory.GROUP_COACHING,
  DealCategory.COLIVING,
  DealCategory.COWORKING,
  DealCategory.RETREAT,
  DealCategory.HOTELS,
  DealCategory.MASTERMIND,
  DealCategory.RESTAURANT,
  DealCategory.TRANSPORTATION,
]

// Utility function to get categories with labels for selects
export function getDealCategoriesWithLabels(t: any, includeAll: boolean = false) {
  const categories = ALL_DEAL_CATEGORIES.map(category => ({
    value: category,
    label: t(`dealCategories.${category}`)
  }))

  if (includeAll) {
    return [
      { value: 'all', label: t('deals.filters.allCategories') },
      ...categories
    ]
  }

  return categories
}