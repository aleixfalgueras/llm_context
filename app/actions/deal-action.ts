'use server'

import { revalidatePath } from 'next/cache'
import { DealService } from '@/services/deal-service'
import { checkAuth } from '@/lib/api/api-validation'
import { Deal } from '@prisma/client'
import { DealFormData, DealListFilters } from '@/lib/types/deal-types'

export async function getPublicDeals(filters: DealListFilters = {}): Promise<Deal[]> {
  const result = await DealService.getPublicDeals(filters)

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch public deals')
  }

  return result.data
}

export async function getUserDeals(filters: DealListFilters = {}): Promise<Deal[]> {
  const userId = await checkAuth()
  const result = await DealService.getUserDeals(userId, filters)

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user deals')
  }

  return result.data
}

export async function getDealById(dealId: string): Promise<Deal> {
  const userId = await checkAuth()
  const result = await DealService.getDealById(dealId, userId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch deal')
  }

  return result.data
}

export async function createDeal(data: DealFormData): Promise<Deal> {
  const userId = await checkAuth()

  // Validate required fields
  if (!data.title || !data.description || !data.price || !data.externalUrl) {
    throw new Error('Missing required fields: title, description, price, and externalUrl are required')
  }

  const result = await DealService.createDeal(userId, data)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create deal')
  }

  revalidatePath('/deals')
  return result.data
}

export async function updateDeal(dealId: string, data: DealFormData): Promise<Deal> {
  const userId = await checkAuth()
  const result = await DealService.updateDeal(dealId, userId, data)

  if (!result.success) {
    throw new Error(result.error || 'Failed to update deal')
  }

  revalidatePath('/deals')
  return result.data
}

export async function deleteDeal(dealId: string): Promise<void> {
  const userId = await checkAuth()
  const result = await DealService.deleteDeal(dealId, userId)

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete deal')
  }

  revalidatePath('/deals')
}