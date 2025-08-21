import {logger} from '@/lib/logger'
import {AffiliationOperations} from '@/database'
import {Affiliation, AffiliationStatus} from '@prisma/client'
import {AffiliationWithValid} from '@/lib/types/affiliation-types'
import {SubscriptionService} from '@/services/subscription/subscription-service'

export class AffiliationService {
  
  /**
   * Generate a unique affiliation code
   * Format: 6 random alphanumeric characters (uppercase)
   */
  private static generateAffiliationCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'
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

      // Validate parent code if provided
      let finalParentCode: string | null = null
      if (parentAffiliationCode) {
        // Special handling for admin/root network code
        if (parentAffiliationCode === '000000') {
          finalParentCode = null
          logger.info(`Using special admin root code 000000 - creating root-level affiliation for user ${userId}`)
        } else {
          const parentResult = await AffiliationOperations.findAffiliationByCode(parentAffiliationCode)
          if (parentResult.success && parentResult.data) {
            finalParentCode = parentAffiliationCode
          } else {
            const errorMessage = `Invalid parent affiliation code: ${parentAffiliationCode} does not exist`
            logger.error(errorMessage, new Error(errorMessage))
            throw new Error(errorMessage)
          }
        }
      }
      
      // Create new affiliation
      const newAffiliationCode = await this.generateUniqueAffiliationCode()
      const createResult = await AffiliationOperations.createAffiliation({
        userId,
        affiliationCode: newAffiliationCode,
        parentAffiliationCode: finalParentCode,
        status: AffiliationStatus.GenY
      })

      if (!createResult.success) {
        const errorMessage = `Failed to create affiliation for user ${userId}: ${createResult.error}`
        logger.error(errorMessage, new Error(createResult.error))
        throw new Error(errorMessage)
      }

      logger.info(`Created new affiliation for user ${userId} with code ${newAffiliationCode} and parent ${finalParentCode || 'none'}`)
      
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
   * Always checks and includes subscription validity status for each child
   * @param affiliationCode The affiliation code to find children for
   */
  static async getUserAffiliationChildren(
    affiliationCode: string
  ): Promise<{ children: AffiliationWithValid[]; count: number }> {
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
      
      const childrenWithValid: AffiliationWithValid[] = await Promise.all(
        children.map(async (child) => {
          try {
            const subscriptionWithValidation = await SubscriptionService.getUserSubscriptionWithValidation(child.userId)
            return {
              ...child,
              valid: subscriptionWithValidation.isActive && subscriptionWithValidation.stripeSubscriptionId != null
            }
          } catch (error) {
            logger.warn(`Failed to check subscription validity for user ${child.userId}`)
            // If subscription check fails, consider it invalid
            return {
              ...child,
              valid: false
            }
          }
        })
      )

      return {
        children: childrenWithValid,
        count: childrenWithValid.length
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
   * Calculate the appropriate affiliation status based on children count and their statuses
   * @param children Array of child affiliations
   * @returns The calculated AffiliationStatus
   */
  static calculateAffiliationStatus(children: Affiliation[]): AffiliationStatus {
    try {
      if (!children || !Array.isArray(children)) {
        logger.warn('Invalid children array provided to calculateAffiliationStatus, returning GenY')
        return AffiliationStatus.GenY
      }

      const totalChildren = children.length
      
      // Helper function to count children with specific status
      const countChildrenWithStatus = (status: AffiliationStatus): number => {
        return children.filter(child => child.status === status).length
      }

      // Get counts for specific status levels needed for tier calculations
      const genYCount = countChildrenWithStatus(AffiliationStatus.GenY)
      const cristalClubCount = countChildrenWithStatus(AffiliationStatus.CristalClub)
      const sevenStarsCount = countChildrenWithStatus(AffiliationStatus.SevenStars)

      logger.debug(`Calculating status for ${totalChildren} children: GenY=${genYCount}, CristalClub=${cristalClubCount}, SevenStars=${sevenStarsCount}`)

      // Check conditions from highest to lowest tier
      // Omega: 1000+ users & 1+ SevenStars user
      if (totalChildren >= 1000 && sevenStarsCount >= 1) {
        logger.debug('Qualified for Omega status')
        return AffiliationStatus.Omega
      }

      // Alpha: 4000+ users & 10+ CristalClub users
      if (totalChildren >= 4000 && cristalClubCount >= 10) {
        logger.debug('Qualified for Alpha status')
        return AffiliationStatus.Alpha
      }

      // InfinityStars: 2000+ users & 5+ CristalClub users
      if (totalChildren >= 2000 && cristalClubCount >= 5) {
        logger.debug('Qualified for InfinityStars status')
        return AffiliationStatus.InfinityStars
      }

      // SevenStars: 1000+ users & 1+ CristalClub user
      if (totalChildren >= 1000 && cristalClubCount >= 1) {
        logger.debug('Qualified for SevenStars status')
        return AffiliationStatus.SevenStars
      }

      // Walkin: 400+ users & 10+ GenY users
      if (totalChildren >= 400 && genYCount >= 10) {
        logger.debug('Qualified for Walkin status')
        return AffiliationStatus.Walkin
      }

      // D5Level: 200+ users & 5+ GenY users
      if (totalChildren >= 200 && genYCount >= 5) {
        logger.debug('Qualified for D5Level status')
        return AffiliationStatus.D5Level
      }

      // CristalClub: 100+ users & 1+ GenY user
      if (totalChildren >= 100 && genYCount >= 1) {
        logger.debug('Qualified for CristalClub status')
        return AffiliationStatus.CristalClub
      }

      // LightWorker: 50+ users
      if (totalChildren >= 50) {
        logger.debug('Qualified for LightWorker status')
        return AffiliationStatus.LightWorker
      }

      // Indigo: 25+ users
      if (totalChildren >= 25) {
        logger.debug('Qualified for Indigo status')
        return AffiliationStatus.Indigo
      }

      // GenY: Default status (no requirements)
      logger.debug('Using default GenY status')
      return AffiliationStatus.GenY

    } catch (error) {
      logger.error('Unexpected error in calculateAffiliationStatus', error as Error)
      // Return GenY as safe fallback
      return AffiliationStatus.GenY
    }
  }

  /**
   * Check and update user affiliation status if needed based on their children
   * @param userId The user ID to check and update
   * @returns Object with update info: { updated: boolean, oldStatus?: AffiliationStatus, newStatus: AffiliationStatus }
   */
  static async checkAndUpdateUserAffiliationStatus(
    userId: string
  ): Promise<{ updated: boolean; oldStatus?: AffiliationStatus; newStatus: AffiliationStatus }> {
    try {
      // Get user's current affiliation
      const userAffiliation = await this.getUserAffiliation(userId)
      
      if (!userAffiliation) {
        // No affiliation exists, nothing to update
        return {
          updated: false,
          newStatus: AffiliationStatus.GenY
        }
      }

      // Get user's children to calculate new status
      const childrenResult = await this.getUserAffiliationChildren(userAffiliation.affiliationCode)
      
      // Filter only children with valid subscriptions for status calculation
      const validChildren = childrenResult.children.filter(child => child.valid)
      logger.debug(`User ${userId} has ${childrenResult.children.length} total children, 
      ${validChildren.length} with valid subscriptions`)
      
      const calculatedStatus = this.calculateAffiliationStatus(validChildren)

      // Check if status needs updating
      if (calculatedStatus === userAffiliation.status) {
        logger.debug(`User ${userId} status is already up-to-date: ${userAffiliation.status}`)
        return {
          updated: false,
          newStatus: userAffiliation.status
        }
      }

      // Status needs updating
      const oldStatus = userAffiliation.status
      logger.info(`Updating user ${userId} status from ${oldStatus} to ${calculatedStatus} based on ${validChildren.length} valid children (${childrenResult.children.length} total)`)

      // Update the status
      await this.updateAffiliationStatus(userId, calculatedStatus)

      return {
        updated: true,
        oldStatus,
        newStatus: calculatedStatus
      }

    } catch (error) {
      logger.error(`Unexpected error in checkAndUpdateUserStatus for user ${userId}`, error as Error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred while checking and updating user status')
    }
  }

  /**
   * Update affiliation status
   */
  static async updateAffiliationStatus(
    userId: string,
    status: AffiliationStatus
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