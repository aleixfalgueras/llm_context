#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { SubscriptionStatus } from '@prisma/client'
import { invalidateAllUserCaches } from '@/lib/subscription/subscription-cache'

const prisma = new PrismaClient()

interface ScriptArgs {
  userId: string
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.error('❌ Usage: tsx scripts/restore-subscription.ts <userId>')
    console.error('   Example: tsx scripts/restore-subscription.ts user_123abc')
    console.error('')
    console.error('   This script will:')
    console.error('   - Set status to "active"')
    console.error('   - Set currentPeriodEnd to currentPeriodStart + 30 days')
    console.error('   - Clear canceledAt field')
    console.error('   - Keep currentPeriodStart unchanged')
    process.exit(1)
  }

  const [userId] = args
  
  if (!userId || userId.trim() === '') {
    console.error('❌ Error: userId cannot be empty')
    process.exit(1)
  }

  return {
    userId: userId.trim()
  }
}

async function getSubscriptionStatus(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId }
  })
  
  if (!subscription) {
    throw new Error(`No subscription found for user: ${userId}`)
  }
  
  return subscription
}

async function restoreSubscription(userId: string) {
  // First get the current subscription to read currentPeriodStart
  const currentSubscription = await getSubscriptionStatus(userId)
  
  // Calculate new currentPeriodEnd from existing currentPeriodStart + 30 days
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
  const newPeriodEnd = new Date(currentSubscription.currentPeriodStart.getTime() + thirtyDaysInMs)
  
  console.log(`🔄 Using existing currentPeriodStart: ${currentSubscription.currentPeriodStart.toISOString()}`)
  console.log(`📅 Setting currentPeriodEnd to: ${newPeriodEnd.toISOString()}`)
  
  const updatedSubscription = await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.active,
      currentPeriodEnd: newPeriodEnd,
      canceledAt: null,
      updatedAt: new Date()
    }
  })
  
  return updatedSubscription
}

async function main() {
  console.log('🔄 Starting subscription restoration...\n')
  
  try {
    const { userId } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log('')
    
    // Get current subscription status
    const beforeSubscription = await getSubscriptionStatus(userId)
    
    console.log('📋 Current Subscription Status:')
    console.log(`   Status: ${beforeSubscription.status}`)
    console.log(`   Plan: ${beforeSubscription.plan}`)
    console.log(`   Period Start: ${beforeSubscription.currentPeriodStart.toISOString()}`)
    console.log(`   Period End: ${beforeSubscription.currentPeriodEnd.toISOString()}`)
    console.log(`   Canceled At: ${beforeSubscription.canceledAt?.toISOString() || 'N/A'}`)
    console.log('')
    
    // Check if already active and not expired
    const now = new Date()
    const isCurrentlyActive = beforeSubscription.status === SubscriptionStatus.active && 
                             beforeSubscription.currentPeriodEnd > now
    
    if (isCurrentlyActive) {
      console.log('⚠️  Warning: Subscription appears to already be active and not expired')
      console.log('   Proceeding with restoration anyway...')
      console.log('')
    }
    
    // Restore the subscription
    const updatedSubscription = await restoreSubscription(userId)
    
    // Invalidate all user caches to ensure changes take effect immediately
    await invalidateAllUserCaches(userId)
    console.log('🔄 All user caches invalidated')
    
    console.log('\n✅ Success! Subscription has been restored.')
    console.log('\n📋 Restored Subscription Status:')
    console.log(`   Status: ${updatedSubscription.status}`)
    console.log(`   Plan: ${updatedSubscription.plan}`)
    console.log(`   Period Start: ${updatedSubscription.currentPeriodStart.toISOString()} (unchanged)`)
    console.log(`   Period End: ${updatedSubscription.currentPeriodEnd.toISOString()}`)
    console.log(`   Canceled At: ${updatedSubscription.canceledAt?.toISOString() || 'N/A'}`)
    console.log(`   Updated At: ${updatedSubscription.updatedAt.toISOString()}`)

  } catch (error) {
    console.error('\n💥 Error during restoration process:', error)
    if (error instanceof Error) {
      console.error('Details:', error.message)
    }
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Process completed')
  })