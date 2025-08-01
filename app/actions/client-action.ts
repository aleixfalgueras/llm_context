'use server'

import { revalidatePath } from 'next/cache'
import { ClientService } from '@/services/client-service'
import { ClientFormData } from '@/lib/types/client-types'
import { ApiSubscriptionErrorCode } from '@/lib/types/enums'
import { withAuth } from '@/lib/middleware/validation-middleware'

export type ClientData = ClientFormData

export async function createClient(data: ClientFormData) {
  const userId = await withAuth()
  const result = await ClientService.createClient(userId, data)
  
  if (!result.success) {
    // Handle subscription-specific errors for UI
    if (result.error?.includes('subscription has expired')) {
      const error = new Error(result.error)
      ;(error as any).code = ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
      ;(error as any).upgradeUrl = '/subscription'
      throw error
    }
    throw new Error(result.error || 'Failed to create client')
  }

  revalidatePath('/clients')
  return { success: true, client: result.data }
}

export async function updateClient(clientId: string, data: ClientFormData) {
  const userId = await withAuth()

  const result = await ClientService.updateClient(clientId, userId, data)
  
  if (!result.success) {
    // Handle subscription-specific errors for UI
    if (result.error?.includes('subscription has expired')) {
      const error = new Error(result.error)
      ;(error as any).code = ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
      ;(error as any).upgradeUrl = '/subscription'
      throw error
    }
    throw new Error(result.error || 'Failed to update client')
  }

  revalidatePath('/clients')
  return { success: true, client: result.data }
}

export async function deleteClient(id: string) {
  const userId = await withAuth()

  const result = await ClientService.deleteClient(id, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete client')
  }

  revalidatePath('/clients')
  return { success: true }
}

export async function getClients(options?: { includeDetails?: boolean; limit?: number }) {
  const userId = await withAuth()

  const result = await ClientService.getClients(userId, options)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch clients')
  }

  return result.data.records
}

 