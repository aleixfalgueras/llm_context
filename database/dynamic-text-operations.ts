import { prisma } from '@/lib/prisma'
import { DbOperationConfig, DbOperationResult } from '@/lib/types/database-types'
import { DynamicText, DynamicTextCategory } from '@prisma/client'

export class DynamicTextOperations {

  /**
   * Find all dynamic texts, optionally filtered by category
   */
  static async findAll(
    category?: DynamicTextCategory,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<DynamicText[]>> {
    try {
      const dynamicTexts = await prisma.dynamicText.findMany({
        where: category ? { category } : undefined,
        orderBy: [{ category: 'asc' }, { key: 'asc' }, { languageCode: 'asc' }]
      })
      return { success: true, data: dynamicTexts }
    } catch (error) {
      const context = config.context || 'Find all dynamic texts'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  /**
   * Find dynamic text by key and language
   */
  static async findByKeyAndLanguage(
    key: string,
    languageCode: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<DynamicText | null>> {
    try {
      const dynamicText = await prisma.dynamicText.findUnique({
        where: { key_languageCode: { key, languageCode } }
      })
      return { success: true, data: dynamicText }
    } catch (error) {
      const context = config.context || 'Find dynamic text by key and language'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  /**
   * Find all dynamic texts for a specific key (all languages)
   */
  static async findByKey(
    key: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<DynamicText[]>> {
    try {
      const dynamicTexts = await prisma.dynamicText.findMany({
        where: { key },
        orderBy: { languageCode: 'asc' }
      })
      return { success: true, data: dynamicTexts }
    } catch (error) {
      const context = config.context || 'Find dynamic texts by key'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  /**
   * Update a dynamic text value
   */
  static async updateValue(
    id: string,
    value: string,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<DynamicText>> {
    try {
      const dynamicText = await prisma.dynamicText.update({
        where: { id },
        data: { value }
      })
      return { success: true, data: dynamicText }
    } catch (error) {
      const context = config.context || 'Update dynamic text value'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }

  /**
   * Bulk upsert dynamic texts (for seeding/migration)
   */
  static async bulkUpsert(
    texts: Array<{
      key: string
      languageCode: string
      value: string
      category: DynamicTextCategory
    }>,
    config: DbOperationConfig = {}
  ): Promise<DbOperationResult<number>> {
    try {
      let upsertedCount = 0
      for (const text of texts) {
        await prisma.dynamicText.upsert({
          where: { key_languageCode: { key: text.key, languageCode: text.languageCode } },
          update: { value: text.value, category: text.category },
          create: text
        })
        upsertedCount++
      }
      return { success: true, data: upsertedCount }
    } catch (error) {
      const context = config.context || 'Bulk upsert dynamic texts'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `${context}: ${errorMessage}` }
    }
  }
}
