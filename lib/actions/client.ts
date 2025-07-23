'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getUserSubscription, isSubscriptionActive } from '../subscription/subscription-utils'
import { logger } from '../logger'
import { ClientOperations } from '../database'
import { ClientFormData } from '@/types/client'
import { processClientData } from '../utils/validation'
import { ApiSubscriptionErrorCode } from '@/types/enums'

export type ClientData = ClientFormData

export async function createClient(data: ClientFormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Check subscription expiration before creating client
  const subscription = await getUserSubscription(userId)
  if (!isSubscriptionActive(subscription)) {
    const error = new Error('Your subscription has expired. Please upgrade to continue creating clients.')
    ;(error as any).code = ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
    ;(error as any).upgradeUrl = '/subscription'
    throw error
  }

  // Prepare client data with defaults and trim context fields
  const clientData = processClientData({
    ...data,
    documentsLanguage: data.documentsLanguage || 'english',
  })

  const result = await ClientOperations.createClient(userId, clientData)
  
  if (!result.success) {
    logger.error('Error creating client', new Error(result.error), { userId })
    throw new Error(result.error || 'Failed to create client')
  }

  revalidatePath('/clients')
  return { success: true, client: result.data }
}

export async function updateClient(clientId: string, data: ClientFormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Check subscription expiration before updating client
  const subscription = await getUserSubscription(userId)
  if (!isSubscriptionActive(subscription)) {
    const error = new Error('Your subscription has expired. Please upgrade to continue editing clients.')
    ;(error as any).code = ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
    ;(error as any).upgradeUrl = '/subscription'
    throw error
  }

  // Prepare client data with defaults and trim context fields
  const clientData = processClientData({
    ...data,
    documentsLanguage: data.documentsLanguage || 'english',
  })

  const result = await ClientOperations.updateClient(clientId, userId, clientData)
  
  if (!result.success) {
    logger.error('Error updating client', new Error(result.error), { userId, clientId })
    throw new Error(result.error || 'Failed to update client')
  }

  revalidatePath('/clients')
  return { success: true, client: result.data }
}

export async function deleteClient(id: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await ClientOperations.deleteClient(id, userId)
  
  if (!result.success) {
    logger.error('Error deleting client', new Error(result.error), { userId, clientId: id })
    throw new Error(result.error || 'Failed to delete client')
  }


  revalidatePath('/clients')
  return { success: true }
}

export async function getClients(options?: { includeDetails?: boolean; limit?: number }) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

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
    throw new Error(result.error || 'Failed to fetch clients')
  }

  return result.data!.records
}

 