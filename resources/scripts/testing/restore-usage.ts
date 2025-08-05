#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ScriptArgs {
  userId: string
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.error('❌ Usage: tsx scripts/restore-usage.ts <userId>')
    console.error('   Example: tsx scripts/restore-usage.ts user_123abc')
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

async function resetUserUsage(userId: string) {
  const now = new Date()
  
  // Get user's current subscription to determine billing period
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId }
  })
  
  if (!subscription) {
    throw new Error(`No subscription found for user ${userId}`)
  }
  
  const billingPeriodStart = subscription.currentPeriodStart
  const billingPeriodEnd = subscription.currentPeriodEnd
  
  console.log(`🔄 Resetting usage for user: ${userId}`)
  console.log(`📅 Billing period: ${billingPeriodStart.toISOString()} to ${billingPeriodEnd.toISOString()}`)
  
  // Reset the usage record for the current billing period
  const updatedUsage = await prisma.userUsage.upsert({
    where: {
      userId_billingPeriodStart_billingPeriodEnd: {
        userId,
        billingPeriodStart,
        billingPeriodEnd
      }
    },
    update: {
      tokensUsed: 0,
      updatedAt: now
    },
    create: {
      userId,
      billingPeriodStart,
      billingPeriodEnd,
      tokensUsed: 0,
    }
  })
  
  return updatedUsage
}

async function main() {
  console.log('🔄 Starting usage reset...\n')
  
  try {
    const { userId } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log('')
    
    // Reset usage to zero
    const updatedUsage = await resetUserUsage(userId)
    
    console.log('\n✅ Success! Usage has been reset to zero.')
    console.log('\n📋 Final Usage Summary:')
    console.log(`   User ID: ${userId}`)
    console.log(`   Billing Period: ${updatedUsage.billingPeriodStart.toISOString()} to ${updatedUsage.billingPeriodEnd.toISOString()}`)
    console.log(`   Tokens Used: ${updatedUsage.tokensUsed.toLocaleString()}`)

  } catch (error) {
    console.error('\n💥 Error during reset process:', error)
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