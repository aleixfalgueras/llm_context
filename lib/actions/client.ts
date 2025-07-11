'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { checkUsageLimit, getUserSubscription, isSubscriptionActive } from '../payments/subscription-utils'
import { logger } from '../logger'
import { ClientOperations } from '../database'
import { ClientFormData } from '@/types/client'
import { prisma } from '../prisma'
import { processClientData } from '../validation-helpers'
import { ApiSubscriptionErrorCode } from '@/types/enums'

export type ClientData = ClientFormData

export async function createClient(data: ClientFormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Check usage limits before creating client
  const usageCheck = await checkUsageLimit(userId, 'client')
  if (!usageCheck.allowed) {
    if (usageCheck.reason === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED) {
      const error = new Error('Your subscription has expired. Please upgrade to continue creating clients.')
      ;(error as any).code = ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
      ;(error as any).upgradeUrl = '/subscription'
      throw error
    }
    throw new Error(`You've reached your client limit of ${usageCheck.limit}. Upgrade to Pro for unlimited clients.`)
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

  // Invalidate client count cache since client count has changed
  try {
    const { invalidateClientCountCache } = await import('../payments/subscription-cache')
    invalidateClientCountCache(userId)
  } catch (error) {
    console.error('Error invalidating client count cache:', error)
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

  // Invalidate client count cache since client count has changed
  try {
    const { invalidateClientCountCache } = await import('../payments/subscription-cache')
    invalidateClientCountCache(userId)
  } catch (error) {
    console.error('Error invalidating client count cache:', error)
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

export async function getClient(id: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const result = await ClientOperations.findUserOwnedRecord(
    prisma.client,
    id,
    userId,
    { context: 'Get client by ID' }
  )
  
  if (!result.success) {
    logger.error('Error fetching client', new Error(result.error), { userId, clientId: id })
    throw new Error(result.error || 'Failed to fetch client')
  }

  return result.data!
} 