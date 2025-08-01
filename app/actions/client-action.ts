'use server'

import { revalidatePath } from 'next/cache'
import { ClientService } from '@/services/client-service'
import { withAuth } from '@/lib/middleware/validation-middleware'
import { Prisma, Client } from '@prisma/client'

export async function createClient(data: Omit<Prisma.ClientCreateInput, 'userId'>): Promise<Client> {
  const userId = await withAuth()
  const result = await ClientService.createClient(userId, data)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to create client')
  }

  revalidatePath('/clients')
  return result.data

}

export async function updateClient(clientId: string, data: Omit<Prisma.ClientCreateInput, 'userId'>): Promise<Client> {
  const userId = await withAuth()

  const result = await ClientService.updateClient(clientId, userId, data)

  if (!result.success) {
    throw new Error(result.error || 'Failed to update client')
  }

  revalidatePath('/clients')
  return result.data
}

export async function deleteClient(id: string): Promise<void> {
  const userId = await withAuth()
  const result = await ClientService.deleteClient(id, userId)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete client')
  }

  revalidatePath('/clients')
}

export async function getClients(options?: { includeDetails?: boolean; limit?: number }): Promise<Client[]> {
  const userId = await withAuth()
  const result = await ClientService.getClients(userId, options)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch clients')
  }

  return result.data.records
}

 