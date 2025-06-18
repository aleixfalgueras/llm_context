'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface ClientData {
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  height?: number
  weight?: number
  goals?: string
  medicalHistory?: string
  notes?: string
}

export async function createClient(data: ClientData) {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        height: data.height,
        weight: data.weight,
        goals: data.goals,
        medicalHistory: data.medicalHistory,
        notes: data.notes,
      },
    })

    revalidatePath('/clients')
    return { success: true, client }
  } catch (error) {
    console.error('Error creating client:', error)
    throw new Error('Failed to create client')
  }
}

export async function updateClient(id: string, data: ClientData) {
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

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        height: data.height,
        weight: data.weight,
        goals: data.goals,
        medicalHistory: data.medicalHistory,
        notes: data.notes,
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

export async function getClients() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { clientNotes: true }
        }
      }
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
      where: { id, userId },
      include: {
        clientNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
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