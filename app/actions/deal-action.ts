'use server'

import { revalidatePath } from 'next/cache'
import { DealService } from '@/services/deal-service'
import { checkAuth } from '@/lib/api/api-validation'
import { Deal } from '@prisma/client'
import { DealFormData, DealListFilters } from '@/lib/types/deal-types'
import { validateImageFile } from '@/lib/utils/validation'

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

export async function createDeal(formData: FormData): Promise<Deal> {
  const userId = await checkAuth()

  // Extract form fields
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = formData.get('price') as string
  const category = formData.get('category') as string
  const externalUrl = formData.get('externalUrl') as string
  const validFrom = formData.get('validFrom') as string
  const validUntil = formData.get('validUntil') as string
  const isActive = formData.get('isActive') === 'true'
  const imageFile = formData.get('imageFile') as File | null

  // Validate required fields
  if (!title || !description || !price || !category || !externalUrl) {
    throw new Error('Missing required fields: title, description, price, category, and externalUrl are required')
  }

  // Validate image file if provided
  if (imageFile && imageFile.size > 0) {
    const validation = validateImageFile(imageFile)
    if (!validation.isValid) {
      throw new Error(validation.firstError || 'Invalid image file')
    }
  }

  const data: DealFormData = {
    title,
    description,
    price,
    category: category as any, // TypeScript will validate this is a valid DealCategory
    externalUrl,
    validFrom: validFrom ? new Date(validFrom) : null,
    validUntil: validUntil ? new Date(validUntil) : null,
    isActive
  }

  const result = await DealService.createDeal(userId, data, imageFile || undefined)

  if (!result.success) {
    throw new Error(result.error || 'Failed to create deal')
  }

  revalidatePath('/deals')
  return result.data
}

export async function updateDeal(dealId: string, formData: FormData): Promise<Deal> {
  const userId = await checkAuth()

  // Extract form fields
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = formData.get('price') as string
  const category = formData.get('category') as string
  const externalUrl = formData.get('externalUrl') as string
  const validFrom = formData.get('validFrom') as string
  const validUntil = formData.get('validUntil') as string
  const isActive = formData.get('isActive') === 'true'
  const imageFile = formData.get('imageFile') as File | null
  const removeImage = formData.get('removeImage') === 'true'

  const data: DealFormData = {
    title,
    description,
    price,
    category: category as any, // TypeScript will validate this is a valid DealCategory
    externalUrl,
    validFrom: validFrom ? new Date(validFrom) : null,
    validUntil: validUntil ? new Date(validUntil) : null,
    isActive
  }

  // Handle image update: undefined = no change, null = remove, File = replace
  let imageUpdate: File | null | undefined = undefined
  if (removeImage) {
    imageUpdate = null
  } else if (imageFile && imageFile.size > 0) {
    // Validate image file before updating
    const validation = validateImageFile(imageFile)
    if (!validation.isValid) {
      throw new Error(validation.firstError || 'Invalid image file')
    }
    imageUpdate = imageFile
  }

  const result = await DealService.updateDeal(dealId, userId, data, imageUpdate)

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