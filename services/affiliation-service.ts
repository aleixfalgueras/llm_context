import {logger} from '@/lib/logger'
import {AffiliationOperations} from '@/database'
import {Affiliation} from '@prisma/client'

export class AffiliationService {
  
  /**
   * Generate a unique affiliation code
   * Format: 6 random alphanumeric characters (uppercase)
   */
  private static generateAffiliationCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return code
  }

  /**
   * Ensure generated code is unique by checking database
   */
  private static async generateUniqueAffiliationCode(): Promise<string> {
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      const code = this.generateAffiliationCode()
      const existing = await AffiliationOperations.findAffiliationByCode(code)
      
      if (!existing.success || !existing.data) {
        return code
      }
      
      attempts++
    }
    
    throw new Error('Failed to generate unique affiliation code after maximum attempts')
  }

  /**
   * Get or create unique affiliation code for a user
   * If user already has an affiliation, return the existing code
   * Otherwise create a new affiliation with a unique code
   */
  static async getOrCreateUserAffiliationCode(
    userId: string,
    parentAffiliationCode?: string
  ): Promise<{ affiliationCode: string; isNew: boolean }> {
    try {
      // Check if user already has an affiliation
      const existingResult = await AffiliationOperations.findUserAffiliation(userId)
      
      if (existingResult.success && existingResult.data) {
        return {
          affiliationCode: existingResult.data.affiliationCode,
          isNew: false
        }
      }

      // Generate new unique affiliation code
      const newAffiliationCode = await this.generateUniqueAffiliationCode()
      
      // Use provided parent code or default to 'SYSTEM' for root affiliations
      const finalParentCode = parentAffiliationCode || 'SYSTEM'
      
      // Create new affiliation
      const createResult = await AffiliationOperations.createAffiliation({
        userId,
        affiliationCode: newAffiliationCode,
        parentAffiliationCode: finalParentCode,
        status: 'Gen Y'
      })

      if (!createResult.success) {
        const errorMessage = `Failed to create affiliation for user ${userId} with parent ${finalParentCode}: ${createResult.error}`
        logger.error(errorMessage, new Error(createResult.error))
        throw new Error(errorMessage)
      }

      logger.info(`Created new affiliation for user ${userId} with code ${newAffiliationCode} and parent ${finalParentCode}`)
      
      return {
        affiliationCode: newAffiliationCode,
        isNew: true
      }
    } catch (error) {
      logger.error(`Unexpected error in getOrCreateUserAffiliationCode for user ${userId}`, error as Error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while managing affiliation code')
    }
  }

  /**
   * Get all affiliation children of a user by their affiliation code
   * Returns all rows where parentAffiliationCode matches the provided code
   */
  static async getUserAffiliationChildren(
    affiliationCode: string
  ): Promise<{ children: Affiliation[]; count: number }> {
    try {
      // First verify the affiliation code exists
      const parentResult = await AffiliationOperations.findAffiliationByCode(affiliationCode)
      
      if (!parentResult.success || !parentResult.data) {
        throw new Error('Affiliation code not found')
      }

      // Get all children affiliations
      const childrenResult = await AffiliationOperations.findAffiliationChildren(
        affiliationCode,
        {
          orderBy: { createdAt: 'desc' }
        }
      )

      if (!childrenResult.success) {
        const errorMessage = `Failed to fetch affiliation children for code ${affiliationCode}: ${childrenResult.error}`
        logger.error(errorMessage, new Error(childrenResult.error))
        throw new Error(errorMessage)
      }

      const children = childrenResult.data || []
      
      logger.info(`Fetched ${children.length} affiliation children for code ${affiliationCode}`)

      return {
        children,
        count: children.length
      }
    } catch (error) {
      logger.error(`Unexpected error in getUserAffiliationChildren for code ${affiliationCode}`, error as Error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching affiliation children')
    }
  }

  /**
   * Get affiliation details by user ID
   */
  static async getUserAffiliation(
    userId: string
  ): Promise<Affiliation | null> {
    try {
      const result = await AffiliationOperations.findUserAffiliation(userId)
      
      if (!result.success) {
        const errorMessage = `Failed to fetch user affiliation for user ${userId}: ${result.error}`
        logger.error(errorMessage, new Error(result.error))
        throw new Error(errorMessage)
      }

      return result.data
    } catch (error) {
      logger.error(`Unexpected error in getUserAffiliation for user ${userId}`, error as Error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while fetching user affiliation')
    }
  }

  /**
   * Update affiliation status
   */
  static async updateAffiliationStatus(
    userId: string,
    status: string
  ): Promise<Affiliation> {
    try {
      // First get the affiliation
      const affiliationResult = await AffiliationOperations.findUserAffiliation(userId)
      
      if (!affiliationResult.success || !affiliationResult.data) {
        throw new Error('User affiliation not found')
      }

      // Update the status
      const updateResult = await AffiliationOperations.updateAffiliation(
        affiliationResult.data.id,
        { status }
      )

      if (!updateResult.success) {
        const errorMessage = `Failed to update affiliation status to ${status} for user ${userId}: ${updateResult.error}`
        logger.error(errorMessage, new Error(updateResult.error))
        throw new Error(errorMessage)
      }
      
      logger.info(`Updated affiliation status to ${status} for user ${userId}`)
      return updateResult.data
    } catch (error) {
      logger.error(`Unexpected error in updateAffiliationStatus for user ${userId} with status ${status}`, error as Error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while updating affiliation status')
    }
  }
}