#!/usr/bin/env tsx
/**
 * Usage Limit Testing Script
 * 
 * Sets a user's token usage to the maximum limits for their current subscription plan.
 * 
 * Usage: tsx scripts/usage-max.ts <userId>
 * 
 * Examples:
 *   tsx scripts/usage-max.ts user_123   # Set token usage to max for their current plan
 */
import { PrismaClient, SubscriptionPlan } from '@prisma/client'
import {SUBSCRIPTION_PLAN_DETAIL} from '@/lib/types/subscription-types'

const prisma = new PrismaClient()

interface ScriptArgs {
  userId: string
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.error('❌ Usage: tsx scripts/usage-max.ts <userId>')
    console.error('   Examples:')
    console.error('     tsx scripts/usage-max.ts user_123abc')
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

async function getUserSubscription(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId }
  })

  if (!subscription) {
    console.log(`⚠️  No subscription found for user ${userId}. Creating a basic subscription...`)
    
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    
    const newSubscription = await prisma.userSubscription.create({
      data: {
        userId,
        plan: SubscriptionPlan.basic,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        tokenLimit: SUBSCRIPTION_PLAN_DETAIL[SubscriptionPlan.basic].tokenLimit,
      }
    })
    
    console.log(`✅ Created basic subscription for user ${userId}`)
    return newSubscription
  }

  return subscription
}

async function updateUserUsageToMax(userId: string, subscription: any) {
  const plan = SUBSCRIPTION_PLAN_DETAIL[subscription.plan as SubscriptionPlan]
  const billingPeriodStart = subscription.currentPeriodStart
  const billingPeriodEnd = subscription.currentPeriodEnd
  
  console.log(`🎯 Setting token usage to maximum for plan: ${subscription.plan}`)
  console.log(`📅 Billing period: ${billingPeriodStart.toISOString()} to ${billingPeriodEnd.toISOString()}`)
  
  // Check if current usage record exists for reference
  await prisma.userUsage.findUnique({
    where: {
      userId_billingPeriodStart_billingPeriodEnd: {
        userId,
        billingPeriodStart,
        billingPeriodEnd
      }
    }
  })
  
  // Determine target token usage based on plan
  let targetTokens: number
  
  if (subscription.plan === SubscriptionPlan.business) {
    // For business plan, use high but finite value
    targetTokens = 4000000  // Business plan limit
  } else {
    // For basic and pro plans, use plan limits
    targetTokens = plan.tokenLimit
  }
  
  // Set token usage to maximum
  console.log(`📊 Setting TOKENS to maximum:`)
  console.log(`   Tokens: ${targetTokens.toLocaleString()} (at limit)`)
  
  // Upsert the usage record for the current billing period
  const updatedUsage = await prisma.userUsage.upsert({
    where: {
      userId_billingPeriodStart_billingPeriodEnd: {
        userId,
        billingPeriodStart,
        billingPeriodEnd
      }
    },
    update: {
      tokensUsed: targetTokens,
      updatedAt: new Date()
    },
    create: {
      userId,
      billingPeriodStart,
      billingPeriodEnd,
      tokensUsed: targetTokens,
    }
  })
  
  return updatedUsage
}


async function main() {
  console.log('🚀 Starting usage limit testing setup...\n')
  
  try {
    const { userId } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log('')
    
    // Step 1: Get user's current subscription
    console.log('📝 Step 1: Reading user subscription...')
    const subscription = await getUserSubscription(userId)
    console.log(`📋 Current Plan: ${subscription.plan}`)
    
    // Step 2: Set token usage to maximum for their current plan
    console.log(`\n📊 Step 2: Setting token usage to maximum limits...`)
    const updatedUsage = await updateUserUsageToMax(userId, subscription)
    
    console.log(`\n✅ Success! Token usage set to maximum.`)
    console.log('\n📋 Final Usage Summary:')
    console.log(`   User ID: ${userId}`)
    console.log(`   Plan: ${subscription.plan}`)
    console.log(`   Billing Period: ${updatedUsage.billingPeriodStart.toISOString()} to ${updatedUsage.billingPeriodEnd.toISOString()}`)
    console.log(`   Tokens Used: ${updatedUsage.tokensUsed.toLocaleString()}`)
    
    console.log('\n🧪 Testing Tips:')
    console.log('   • Try creating content that uses many tokens - it should be blocked by token limit')
    console.log('   • Check the usage info API to see limit warnings')
    console.log('   • Test the subscription upgrade flow')
    console.log('   • Use /api/subscription/usage-info to verify limits')
    
  } catch (error) {
    console.error('\n💥 Error during setup process:', error)
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