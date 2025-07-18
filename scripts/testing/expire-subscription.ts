#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { SubscriptionStatus } from '@prisma/client'
import { invalidateAllUserCaches } from "@/lib/subscription/subscription-cache";

const prisma = new PrismaClient()

interface ScriptArgs {
  userId: string
  cancel: boolean
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length < 1 || args.length > 2) {
    console.error('❌ Usage: tsx scripts/expire-subscription.ts <userId> [cancel]')
    console.error('   Example: tsx scripts/expire-subscription.ts user_123abc')
    console.error('   Example: tsx scripts/expire-subscription.ts user_123abc cancel')
    console.error('')
    console.error('   Without "cancel": Sets status to past_due and currentPeriodEnd to yesterday')
    console.error('   With "cancel": Sets status to canceled and canceledAt timestamp')
    process.exit(1)
  }

  const [userId, cancelFlag] = args
  
  if (!userId || userId.trim() === '') {
    console.error('❌ Error: userId cannot be empty')
    process.exit(1)
  }

  const cancel = cancelFlag === 'cancel'
  
  if (cancelFlag && !cancel) {
    console.error('❌ Error: Second argument must be "cancel" if provided')
    process.exit(1)
  }

  return {
    userId: userId.trim(),
    cancel
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

async function expireSubscriptionByDate(userId: string) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  console.log(`⚠️ Setting status to past_due and currentPeriodEnd to: ${yesterday.toISOString()}`)
  
  const updatedSubscription = await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.past_due,
      currentPeriodEnd: yesterday,
      updatedAt: new Date()
    }
  })
  
  return updatedSubscription
}

async function cancelSubscription(userId: string) {
  const now = new Date()
  
  console.log(`❌ Setting status to canceled with canceledAt: ${now.toISOString()}`)
  
  const updatedSubscription = await prisma.userSubscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.canceled,
      canceledAt: now,
      updatedAt: now
    }
  })
  
  return updatedSubscription
}

async function main() {
  console.log('⏰ Starting subscription expiration...\n')
  
  try {
    const { userId, cancel } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log(`🔧 Mode: ${cancel ? 'Cancel subscription' : 'Set past_due status'}`)
    console.log('')
    
    // Get current subscription status
    const beforeSubscription = await getSubscriptionStatus(userId)
    
    console.log('📋 Current Subscription Status:')
    console.log(`   Status: ${beforeSubscription.status}`)
    console.log(`   Plan: ${beforeSubscription.plan}`)
    console.log(`   Period End: ${beforeSubscription.currentPeriodEnd.toISOString()}`)
    console.log(`   Canceled At: ${beforeSubscription.canceledAt?.toISOString() || 'N/A'}`)
    console.log('')
    
    // Apply the expiration method
    let updatedSubscription
    if (cancel) {
      updatedSubscription = await cancelSubscription(userId)
    } else {
      updatedSubscription = await expireSubscriptionByDate(userId)
    }

    // Invalidate all user caches to ensure changes take effect immediately
    await invalidateAllUserCaches(userId)
    console.log('🔄 All user caches invalidated')

    console.log('\n✅ Success! Subscription has been expired.')
    console.log('\n📋 Updated Subscription Status:')
    console.log(`   Status: ${updatedSubscription.status}`)
    console.log(`   Plan: ${updatedSubscription.plan}`)
    console.log(`   Period End: ${updatedSubscription.currentPeriodEnd.toISOString()}`)
    console.log(`   Canceled At: ${updatedSubscription.canceledAt?.toISOString() || 'N/A'}`)
    console.log(`   Updated At: ${updatedSubscription.updatedAt.toISOString()}`)

  } catch (error) {
    console.error('\n💥 Error during expiration process:', error)
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