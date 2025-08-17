import {SubscriptionService} from '@/services/subscription-service'
import {logger} from '@/lib/logger'
import {ClientOperations} from '@/database'
import {Client, Prisma} from '@prisma/client'
import {DbOperationResult} from '@/lib/types/database-types'
import {sanitizeToNull} from "@/lib/utils/validation";
import {SubscriptionErrorCode} from "@/services/error-codes";
import {StorageService} from '@/services/storage-service';

/**
 * Process client data by trimming context fields and converting empty strings to null
 */
export function prepareClientData(
  data: Omit<Prisma.ClientCreateInput, 'userId'>
): Omit<Prisma.ClientCreateInput, 'userId'> {
  const processed = {...data}

  // Trim context fields and convert empty strings to null for nullable fields
  if (processed.generalContext !== undefined) {
    processed.generalContext = sanitizeToNull(processed.generalContext)
  }
  if (processed.specificContext1 !== undefined) {
    processed.specificContext1 = sanitizeToNull(processed.specificContext1)
  }
  if (processed.specificContext2 !== undefined) {
    processed.specificContext2 = sanitizeToNull(processed.specificContext2)
  }
  if (processed.specificContext3 !== undefined) {
    processed.specificContext3 = sanitizeToNull(processed.specificContext3)
  }

  // Also handle other nullable string fields
  if (processed.email !== undefined) {
    processed.email = sanitizeToNull(processed.email)
  }
  if (processed.phone !== undefined) {
    processed.phone = sanitizeToNull(processed.phone)
  }
  if (processed.country !== undefined) {
    processed.country = sanitizeToNull(processed.country)
  }

  return processed
}

export class ClientService {
  /**
   * Create a new client with business validation
   */
  static async createClient(
    userId: string, 
    data: Omit<Prisma.ClientCreateInput, 'userId'>
  ): Promise<DbOperationResult<Client>> {
    try {
      // Check subscription expiration before creating client
      const subscriptionWithValidation = await SubscriptionService.getUserSubscriptionWithValidation(userId)
      if (!subscriptionWithValidation.isActive) {
        return {
          success: false,
          error: SubscriptionErrorCode.SUBSCRIPTION_EXPIRED
        }
      }

      // Prepare client data with defaults and trim context fields
      const clientData = prepareClientData({
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
  static async updateUserClient(
    clientId: string,
    userId: string,
    data: Omit<Prisma.ClientCreateInput, 'userId'>
  ): Promise<DbOperationResult<Client>> {
    try {
      // Check subscription expiration before updating client
      const subscriptionWithValidation = await SubscriptionService.getUserSubscriptionWithValidation(userId)
      if (!subscriptionWithValidation.isActive) {
        return {
          success: false,
          error: SubscriptionErrorCode.SUBSCRIPTION_EXPIRED
        }
      }

      // Prepare client data with defaults and trim context fields
      const clientData = prepareClientData({
        ...data,
        documentsLanguage: data.documentsLanguage || 'english',
      })

      const result = await ClientOperations.updateUserClient(clientId, userId, clientData)
      
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
   * Delete a client and all associated document storage
   */
  static async deleteUserClient(
    clientId: string,
    userId: string
  ): Promise<DbOperationResult<{ id: string }>> {
    try {
      // First, clean up document storage for this client
      try {
        await StorageService.deleteClientFolderFromStorage(userId, clientId)
        logger.info(`Successfully cleaned up document storage for client ${clientId}`)
      } catch (storageError) {
        // Log the storage error but don't fail the deletion
        logger.error('Failed to clean up document storage during client deletion', 
          storageError instanceof Error ? storageError : new Error(String(storageError)), 
          { userId, clientId }
        )
        // Continue with database deletion even if storage cleanup fails
      }

      // Delete client from database (this will cascade delete related documents due to onDelete: Cascade)
      const result = await ClientOperations.deleteUserClient(clientId, userId)
      
      if (!result.success) {
        logger.error('Error deleting client from database', new Error(result.error), { userId, clientId })
      } else {
        logger.info(`Successfully deleted client ${clientId} and associated data`)
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
   * Get a single client by ID with ownership validation
   */
  static async getUserClientById(
    clientId: string,
    userId: string
  ): Promise<DbOperationResult<Client>> {
    try {
      const result = await ClientOperations.findUserClientById(clientId, userId)
      
      if (!result.success) {
        logger.error('User client not found', new Error(result.error), { userId, clientId })
      }

      return result
    } catch (error) {
      logger.error('Unexpected error in getClientById service', error as Error, { userId, clientId })
      return {
        success: false,
        error: 'An unexpected error occurred while getting the client'
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