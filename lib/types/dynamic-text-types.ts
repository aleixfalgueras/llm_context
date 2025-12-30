import { DynamicTextCategory } from '@prisma/client'

/**
 * Grouped dynamic texts for UI display
 * Groups texts by key with translations for each language
 */
export interface DynamicTextGroup {
  key: string
  category: DynamicTextCategory
  translations: {
    languageCode: string
    id: string
    value: string
    updatedAt: Date
  }[]
}

/**
 * Categorized dynamic texts for admin UI
 */
export interface DynamicTextsByCategory {
  category: DynamicTextCategory
  categoryLabel: string
  groups: DynamicTextGroup[]
}
