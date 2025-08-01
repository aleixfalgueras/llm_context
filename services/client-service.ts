/**
 * Client business logic service
 * Contains all client-related business rules, validation, and orchestration
 */

import {getUserSubscription, isSubscriptionActive} from '@/lib/subscription/subscription-utils'
import {logger} from '@/lib/logger'
import {ClientOperations} from '@/database'
import {ClientFormData} from '@/lib/types/client-types'
import {processClientData} from '@/lib/utils/validation'
import {DbOperationResult} from '@/lib/types/database-types'
import {Client} from '@prisma/client'

export class ClientService {
  /**
   * Create a new client with business validation
   */
  static async createClient(
    userId: string, 
    data: ClientFormData
  ): Promise<DbOperationResult<Client>> {
    try {
      // Check subscription expiration before creating client
      const subscription = await getUserSubscription(userId)
      if (!isSubscriptionActive(subscription)) {
        return {
          success: false,
          error: 'Your subscription has expired. Please upgrade to continue creating clients.'
        }
      }

      // Prepare client data with defaults and trim context fields
      const clientData = processClientData({
        ...data,
        documentsLanguage: data.documentsLanguage || 'english',
      })

      const result = await ClientOperations.createClient(userId, clientData)
      
      if (!result.success) {
        logger.error('Error creating client', new Error(result.error), { userId })
      }

      return result
    } catch (error) {
      logger.error('Unexpected error in createClient service', error as Error, { userId })
      return {
        success: false,
        error: 'An unexpected error occurred while creating the client'
      }
    }
  }

  /**
   * Update an existing client with business validation
   */
  static async updateClient(
    clientId: string,
    userId: string,
    data: ClientFormData
  ): Promise<DbOperationResult<Client>> {
    try {
      // Check subscription expiration before updating client
      const subscription = await getUserSubscription(userId)
      if (!isSubscriptionActive(subscription)) {
        return {
          success: false,
          error: 'Your subscription has expired. Please upgrade to continue editing clients.'
        }
      }

      // Prepare client data with defaults and trim context fields
      const clientData = processClientData({
        ...data,
        documentsLanguage: data.documentsLanguage || 'english',
      })

      const result = await ClientOperations.updateClient(clientId, userId, clientData)
      
      if (!result.success) {
        logger.error('Error updating client', new Error(result.error), { userId, clientId })
      }

      return result
    } catch (error) {
      logger.error('Unexpected error in updateClient service', error as Error, { userId, clientId })
      return {
        success: false,
        error: 'An unexpected error occurred while updating the client'
      }
    }
  }

  /**
   * Delete a client
   */
  static async deleteClient(
    clientId: string,
    userId: string
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      const result = await ClientOperations.deleteClient(clientId, userId)
      
      if (!result.success) {
        logger.error('Error deleting client', new Error(result.error), { userId, clientId })
      }

      return result
    } catch (error) {
      logger.error('Unexpected error in deleteClient service', error as Error, { userId, clientId })
      return {
        success: false,
        error: 'An unexpected error occurred while deleting the client'
      }
    }
  }

  /**
   * Get clients with optional filtering and selection
   */
  static async getClients(
    userId: string,
    options?: { includeDetails?: boolean; limit?: number }
  ): Promise<DbOperationResult<{ records: Client[] }>> {
    try {
      const pagination = options?.limit ? 
        { page: 1, limit: options.limit, skip: 0 } : 
        undefined

      const config = {
        context: 'Get clients with options',
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          documentsLanguage: true,
          createdAt: true,
          updatedAt: true,
          // Include heavy fields only when requested
          ...(options?.includeDetails && {
            phone: true,
            generalContext: true,
            specificContext1: true,
            specificContext2: true,
            specificContext3: true
          })
        },
        orderBy: { createdAt: 'desc' }
      }

      const result = await ClientOperations.findUserClients(userId, pagination, undefined, config)
      
      if (!result.success) {
        logger.error('Error fetching clients', new Error(result.error), { userId })
      }

      return result
    } catch (error) {
      logger.error('Unexpected error in getClients service', error as Error, { userId })
      return {
        success: false,
        error: 'An unexpected error occurred while fetching clients'
      }
    }
  }
}