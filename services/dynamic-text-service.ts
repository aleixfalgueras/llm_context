import { DynamicTextOperations } from '@/database/dynamic-text-operations'
import { isSuccess } from '@/database/base-operations'
import { DynamicTextGroup, DynamicTextsByCategory } from '@/lib/types/dynamic-text-types'
import { DynamicText, DynamicTextCategory } from '@prisma/client'
import { logger } from '@/lib/logger'

// Category labels for UI display
const CATEGORY_LABELS: Record<DynamicTextCategory, string> = {
  subscription_features: 'Subscription Features'
}

// In-memory cache for subscription features
interface CacheEntry {
  data: Map<string, string>
  timestamp: number
}
const featureCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export class DynamicTextService {

  /**
   * Get all dynamic texts grouped by category and key
   */
  static async getAllGroupedByCategory(): Promise<DynamicTextsByCategory[]> {
    const result = await DynamicTextOperations.findAll()

    if (!isSuccess(result)) {
      logger.error('Failed to fetch dynamic texts', new Error(result.error))
      return []
    }

    return this.groupByCategory(result.data)
  }

  /**
   * Get dynamic texts for a specific category
   */
  static async getByCategory(category: DynamicTextCategory): Promise<DynamicTextGroup[]> {
    const result = await DynamicTextOperations.findAll(category)

    if (!isSuccess(result)) {
      logger.error('Failed to fetch dynamic texts by category', new Error(result.error))
      return []
    }

    const grouped = this.groupByCategory(result.data)
    return grouped[0]?.groups || []
  }

  /**
   * Update a dynamic text value
   */
  static async updateText(id: string, value: string): Promise<DynamicText | null> {
    if (!value.trim()) {
      throw new Error('Value cannot be empty')
    }

    const result = await DynamicTextOperations.updateValue(id, value.trim())

    if (!isSuccess(result)) {
      throw new Error(result.error)
    }

    // Invalidate cache so changes are reflected immediately
    this.invalidateFeatureCache()

    logger.info(`Dynamic text updated: ${id}`)
    return result.data
  }

  /**
   * Get translation value with fallback to English
   */
  static async getTranslation(key: string, languageCode: string): Promise<string | null> {
    // Try requested language first
    let result = await DynamicTextOperations.findByKeyAndLanguage(key, languageCode)

    if (isSuccess(result) && result.data) {
      return result.data.value
    }

    // Fallback to English
    if (languageCode !== 'en') {
      result = await DynamicTextOperations.findByKeyAndLanguage(key, 'en')
      if (isSuccess(result) && result.data) {
        return result.data.value
      }
    }

    return null
  }

  /**
   * Get all translations for a key (used in batch loading)
   */
  static async getTranslationsForKey(key: string): Promise<Map<string, string>> {
    const result = await DynamicTextOperations.findByKey(key)
    const translations = new Map<string, string>()

    if (isSuccess(result)) {
      result.data.forEach(dt => translations.set(dt.languageCode, dt.value))
    }

    return translations
  }

  /**
   * Get all subscription features for a given language (with caching)
   * Returns a Map of key -> value for quick lookup
   */
  static async getSubscriptionFeatures(languageCode: string): Promise<Map<string, string>> {
    const cacheKey = `subscription_features_${languageCode}`
    const cached = featureCache.get(cacheKey)
    const now = Date.now()

    // Return cached data if valid
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return cached.data
    }

    // Fetch from database
    const result = await DynamicTextOperations.findAll(DynamicTextCategory.subscription_features)

    if (!isSuccess(result)) {
      logger.error('Failed to fetch subscription features', new Error(result.error))
      return new Map()
    }

    // Build map for requested language, with English fallback
    const featuresMap = new Map<string, string>()
    const englishFallback = new Map<string, string>()

    for (const text of result.data) {
      if (text.languageCode === 'en') {
        englishFallback.set(text.key, text.value)
      }
      if (text.languageCode === languageCode) {
        featuresMap.set(text.key, text.value)
      }
    }

    // Apply English fallback for missing translations
    if (languageCode !== 'en') {
      for (const [key, value] of Array.from(englishFallback.entries())) {
        if (!featuresMap.has(key)) {
          featuresMap.set(key, value)
        }
      }
    }

    // Store in cache
    featureCache.set(cacheKey, { data: featuresMap, timestamp: now })

    return featuresMap
  }

  /**
   * Invalidate the feature cache (call after admin edits)
   */
  static invalidateFeatureCache(): void {
    featureCache.clear()
    logger.info('Dynamic text feature cache invalidated')
  }

  /**
   * Helper: Group flat dynamic texts by category and key
   */
  private static groupByCategory(texts: DynamicText[]): DynamicTextsByCategory[] {
    const categoryMap = new Map<DynamicTextCategory, Map<string, DynamicTextGroup>>()

    for (const text of texts) {
      if (!categoryMap.has(text.category)) {
        categoryMap.set(text.category, new Map())
      }

      const keyMap = categoryMap.get(text.category)!
      if (!keyMap.has(text.key)) {
        keyMap.set(text.key, {
          key: text.key,
          category: text.category,
          translations: []
        })
      }

      keyMap.get(text.key)!.translations.push({
        languageCode: text.languageCode,
        id: text.id,
        value: text.value,
        updatedAt: text.updatedAt
      })
    }

    const result: DynamicTextsByCategory[] = []
    Array.from(categoryMap.entries()).forEach(([category, keyMap]) => {
      result.push({
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        groups: Array.from(keyMap.values())
      })
    })

    return result
  }
}
