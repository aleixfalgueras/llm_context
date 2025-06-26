'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkUsageLimit, updateUsageTracking } from './subscription-utils'
import { logger } from './logger'

export interface ClientData {
  name: string
  email?: string
  phone?: string
  country?: string
  notes?: string
  documentsLanguage?: string
}

interface ClientFormData {
  name: string
  email?: string
  phone?: string
  country?: string
  notes?: string
  documentsLanguage?: string
}

export async function createClient(data: ClientFormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Check usage limits before creating client
  const usageCheck = await checkUsageLimit(userId, 'client')
  if (!usageCheck.allowed) {
    throw new Error(`You've reached your client limit of ${usageCheck.limit}. Upgrade to Pro for unlimited clients.`)
  }

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        notes: data.notes,
        documentsLanguage: data.documentsLanguage || 'english',
      },
    })

    // No longer tracking client creation events - we check total client count instead



    revalidatePath('/clients')
    return { success: true, client }
  } catch (error) {
    logger.error('Error creating client', error as Error, { userId })
    throw new Error('Failed to create client')
  }
}

export async function updateClient(clientId: string, data: ClientFormData) {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }

  try {
    // Verify client belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    })

    if (!existingClient) {
      throw new Error('Client not found or access denied')
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        notes: data.notes,
        documentsLanguage: data.documentsLanguage || 'english',
      },
    })

    revalidatePath('/clients')
    return { success: true, client }
  } catch (error) {
    console.error('Error updating client:', error)
    throw new Error('Failed to update client')
  }
}

export async function deleteClient(id: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify the client belongs to the user
    const existingClient = await prisma.client.findFirst({
      where: { id, userId }
    })

    if (!existingClient) {
      throw new Error('Client not found or unauthorized')
    }

    await prisma.client.delete({
      where: { id }
    })

    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    console.error('Error deleting client:', error)
    throw new Error('Failed to delete client')
  }
}

export async function getClients(options?: { includeDetails?: boolean; limit?: number }) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const clients = await prisma.client.findMany({
      where: { userId },
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
          goals: true,
          notes: true
        })
      },
      orderBy: { createdAt: 'desc' },
      ...(options?.limit && { take: options.limit })
    })

    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw new Error('Failed to fetch clients')
  }
}

export async function getClient(id: string) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id, userId }
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return client
  } catch (error) {
    console.error('Error fetching client:', error)
    throw new Error('Failed to fetch client')
  }
} 