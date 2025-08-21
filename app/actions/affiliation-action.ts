'use server'

import { revalidatePath } from 'next/cache'
import { AffiliationService } from '@/services/affiliation-service'
import { checkAuth } from '@/lib/api/api-validation'
import { Affiliation } from '@prisma/client'
import { AffiliationWithValid } from '@/lib/types/affiliation-types'

export async function getUserAffiliation(): Promise<Affiliation | null> {
  const userId = await checkAuth()
  
  try {
    return await AffiliationService.getUserAffiliation(userId)
  } catch (error) {
    console.error('Error fetching user affiliation:', error)
    return null
  }
}

// for users that didn't use any referral link - now requires parent code
export async function createUserAffiliation(parentAffiliationCode: string): Promise<{ affiliationCode: string; isNew: boolean }> {
  const userId = await checkAuth()
  
  if (!parentAffiliationCode || !parentAffiliationCode.trim()) {
    throw new Error('Parent affiliation code is required')
  }
  
  const result = await AffiliationService.getOrCreateUserAffiliationCode(
    userId,
    parentAffiliationCode.trim().toUpperCase()
  )
  
  revalidatePath('/affiliation')
  return result
}

export async function checkAndUpdateAffiliationStatus(): Promise<{ updated: boolean; oldStatus?: string; newStatus: string }> {
  const userId = await checkAuth()
  
  try {
    const result = await AffiliationService.checkAndUpdateUserAffiliationStatus(userId)
    
    return {
      updated: result.updated,
      oldStatus: result.oldStatus,
      newStatus: result.newStatus
    }
  } catch (error) {
    console.error('Error checking and updating affiliation status:', error)
    return {
      updated: false,
      newStatus: 'GenY'
    }
  }
}

export async function getAffiliationChildren(): Promise<{ children: AffiliationWithValid[]; count: number }> {
  const userId = await checkAuth()
  
  try {
    // First get user's affiliation to get their code
    const userAffiliation = await AffiliationService.getUserAffiliation(userId)
    
    if (!userAffiliation) {
      return { children: [], count: 0 }
    }
    
    return await AffiliationService.getUserAffiliationChildren(userAffiliation.affiliationCode)
  } catch (error) {
    console.error('Error fetching affiliation children:', error)
    return { children: [], count: 0 }
  }
}

export async function unlinkChildAffiliation(childAffiliationCode: string): Promise<{ success: boolean; message: string }> {
  const userId = await checkAuth()
  
  try {
    const result = await AffiliationService.unlinkChildAffiliation(userId, childAffiliationCode)
    
    if (result.success) {
      revalidatePath('/affiliation')
    }
    
    return result
  } catch (error) {
    console.error('Error unlinking child affiliation:', error)
    return {
      success: false,
      message: 'Failed to remove affiliation from network'
    }
  }
}