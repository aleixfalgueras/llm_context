import {DealOperations} from '@/database/deal-operations'
import {logger} from '@/lib/logger'
import {Deal, Prisma, SubscriptionPlan} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {SubscriptionService} from '@/services/subscription/subscription-service'
import {DealFormData, DealListFilters} from "@/lib/types/deal-types";

export class DealService {
  /**
   * Check if user has permission to create deals (knight or higher)
   */
  private static async canUserCreateDeals(userId: string): Promise<boolean> {
    try {
      const subscription = await SubscriptionService.getUserSubscription(userId)

      if (!subscription || !SubscriptionService.isSubscriptionActive(subscription)) {
        return false
      }

      // Only knight, master, and jedi can create deals
      const allowedPlans: SubscriptionPlan[] = [
        SubscriptionPlan.knight,
        SubscriptionPlan.master,
        SubscriptionPlan.jedi
      ]

      return allowedPlans.includes(subscription.plan)
    } catch (error) {
      logger.error('Error checking deal creation permission', error as Error, { userId })
      return false
    }
  }

  /**
   * Get all deals for a user with filters
   */
  static async getUserDeals(
    userId: string,
    filters: DealListFilters = {}
  ): Promise<DbOperationResult<Deal[]>> {
    try {
      const { searchTerm, isActive, isApproved } = filters

      const result = await DealOperations.findUserDeals(
        userId,
        undefined, // no pagination for now
        { searchTerm, isActive, isApproved }
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!.records as Deal[]
      }
    } catch (error) {
      logger.error('Error fetching user deals', error as Error, { userId })
      return {
        success: false,
        error: 'Failed to fetch deals'
      }
    }
  }

  /**
   * Get all public deals (active and approved)
   */
  static async getPublicDeals(
    filters: DealListFilters = {}
  ): Promise<DbOperationResult<Deal[]>> {
    try {
      const result = await DealOperations.findAllDeals(
        undefined, // no pagination for now
        {
          searchTerm: filters.searchTerm,
          isActive: true,
          isApproved: true
        }
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      return {
        success: true,
        data: result.data!.records as Deal[]
      }
    } catch (error) {
      logger.error('Error fetching public deals', error as Error)
      return {
        success: false,
        error: 'Failed to fetch deals'
      }
    }
  }

  /**
   * Get a single deal by ID
   */
  static async getDealById(
    dealId: string,
    userId: string
  ): Promise<DbOperationResult<Deal>> {
    return DealOperations.findDealById(dealId, userId)
  }

  /**
   * Get a public deal by ID (must be active and approved)
   */
  static async getPublicDealById(
    dealId: string
  ): Promise<DbOperationResult<Deal>> {
    return DealOperations.findDealByIdPublic(dealId)
  }

  /**
   * Create a new deal (requires knight subscription or higher)
   */
  static async createDeal(
    userId: string,
    data: DealFormData
  ): Promise<DbOperationResult<Deal>> {
    try {
      // Check subscription tier
      const canCreate = await this.canUserCreateDeals(userId)
      if (!canCreate) {
        return {
          success: false,
          error: 'Creating deals requires a Knight subscription or higher'
        }
      }

      // Validate dates if provided
      if (data.validFrom && data.validUntil) {
        const fromDate = new Date(data.validFrom)
        const untilDate = new Date(data.validUntil)

        if (fromDate >= untilDate) {
          return {
            success: false,
            error: 'Valid from date must be before valid until date'
          }
        }
      }

      // Create the deal
      const dealData: Omit<Prisma.DealCreateInput, 'userId'> = {
        title: data.title!!,
        description: data.description!!,
        price: data.price!!,
        externalUrl: data.externalUrl!!,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        isActive: data.isActive ?? true,
        isApproved: false // New deals start as not approved
      }

      const result = await DealOperations.createDeal(userId, dealData)

      if (!result.success) {
        logger.error('Failed to create deal', new Error(result.error), { userId })
      }

      return result as DbOperationResult<Deal>
    } catch (error) {
      logger.error('Error creating deal', error as Error, { userId })
      return {
        success: false,
        error: 'Failed to create deal'
      }
    }
  }

  /**
   * Update an existing deal
   */
  static async updateDeal(
    dealId: string,
    userId: string,
    data: DealFormData
  ): Promise<DbOperationResult<Deal>> {
    try {
      // Validate dates if both are provided
      if (data.validFrom && data.validUntil) {
        const fromDate = new Date(data.validFrom)
        const untilDate = new Date(data.validUntil)

        if (fromDate >= untilDate) {
          return {
            success: false,
            error: 'Valid from date must be before valid until date'
          }
        }
      }

      const updateData: Partial<Prisma.DealUpdateInput> = {}

      // Only include fields that are provided
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.price !== undefined) updateData.price = data.price
      if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
      if (data.isActive !== undefined) updateData.isActive = data.isActive

      const result = await DealOperations.updateDeal(dealId, userId, updateData)

      if (!result.success) {
        logger.error(`Failed to update deal ${dealId}`, new Error(result.error), { userId })
      }

      return result as DbOperationResult<Deal>
    } catch (error) {
      logger.error(`Error updating deal ${dealId}`, error as Error, { userId })
      return {
        success: false,
        error: 'Failed to update deal'
      }
    }
  }

  /**
   * Delete a deal
   */
  static async deleteDeal(
    dealId: string,
    userId: string
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      const result = await DealOperations.deleteDeal(dealId, userId)

      if (!result.success) {
        logger.error(`Failed to delete deal ${dealId}`, new Error(result.error), { userId })
      }

      return result
    } catch (error) {
      logger.error(`Error deleting deal ${dealId}`, error as Error, { userId })
      return {
        success: false,
        error: 'Failed to delete deal'
      }
    }
  }

  /**
   * Approve a deal (admin only)
   */
  static async approveDeal(
    dealId: string
  ): Promise<DbOperationResult<Deal>> {
    try {
      const result = await DealOperations.approveDeal(dealId)

      if (!result.success) {
        logger.error(`Failed to approve deal ${dealId}`, new Error(result.error))
      }

      return result as DbOperationResult<Deal>
    } catch (error) {
      logger.error(`Error approving deal ${dealId}`, error as Error)
      return {
        success: false,
        error: 'Failed to approve deal'
      }
    }
  }

  /**
   * Reject a deal (admin only)
   */
  static async rejectDeal(
    dealId: string
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      // Rejecting = deleting the deal
      const result = await DealOperations.deleteDeal(dealId, '') // Empty userId for admin action

      if (!result.success) {
        logger.error(`Failed to reject deal ${dealId}`, new Error(result.error))
      }

      return result
    } catch (error) {
      logger.error(`Error rejecting deal ${dealId}`, error as Error)
      return {
        success: false,
        error: 'Failed to reject deal'
      }
    }
  }

  /**
   * Get all deals with filters (admin only)
   */
  static async getAllDeals(
    filters?: DealListFilters
  ): Promise<Deal[]> {
    try {
      const result = await DealOperations.findAllDeals(
        undefined,
        filters
      )

      if (!result.success) {
        logger.error('Failed to get all deals', new Error(result.error))
        return []
      }

      return result.data?.records || []
    } catch (error) {
      logger.error('Error getting all deals', error as Error)
      return []
    }
  }
}