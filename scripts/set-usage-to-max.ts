#!/usr/bin/env tsx
/**
 * Usage Limit Testing Script
 * 
 * Sets a user's token usage to the maximum limits for their subscription plan.
 * 
 * Usage: tsx scripts/set-usage-to-max.ts <userId> <planName> <limitType>
 * 
 * Examples:
 *   tsx scripts/set-usage-to-max.ts user_123 basic tokens   # Set token limit to max
 *   tsx scripts/set-usage-to-max.ts user_123 pro tokens     # Set token limit to max
 *   tsx scripts/set-usage-to-max.ts user_123 business tokens # Set token limit to max
 */
import { PrismaClient } from '@prisma/client'
import { SUBSCRIPTION_PLANS } from '../lib/subscription-utils'
import { SubscriptionPlan } from '../types/subscription-types'

const prisma = new PrismaClient()

type PlanName = SubscriptionPlan
type LimitType = 'tokens'

interface ScriptArgs {
  userId: string
  planName: PlanName
  limitType: LimitType
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 3) {
    console.error('❌ Usage: tsx scripts/set-usage-to-max.ts <userId> <planName> <limitType>')
    console.error(`   planName must be one of: ${Object.values(SubscriptionPlan).join(', ')}`)
    console.error('   limitType must be: tokens')
    console.error('   Examples:')
    console.error(`     tsx scripts/set-usage-to-max.ts user_123abc ${SubscriptionPlan.BASIC} tokens`)
    console.error(`     tsx scripts/set-usage-to-max.ts user_123abc ${SubscriptionPlan.PRO} tokens`)
    console.error(`     tsx scripts/set-usage-to-max.ts user_123abc ${SubscriptionPlan.BUSINESS} tokens`)
    process.exit(1)
  }

  const [userId, planName, limitType] = args
  
  if (!userId || userId.trim() === '') {
    console.error('❌ Error: userId cannot be empty')
    process.exit(1)
  }

  if (!Object.values(SubscriptionPlan).includes(planName as SubscriptionPlan)) {
    console.error(`❌ Error: planName must be one of: ${Object.values(SubscriptionPlan).join(', ')}`)
    process.exit(1)
  }

  const validLimitTypes: LimitType[] = ['tokens']
  if (!validLimitTypes.includes(limitType as LimitType)) {
    console.error(`❌ Error: limitType must be: ${validLimitTypes.join(', ')}`)
    process.exit(1)
  }

  return {
    userId: userId.trim(),
    planName: planName as PlanName,
    limitType: limitType as LimitType
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
        plan: SubscriptionPlan.BASIC,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxClients: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxClients,
        maxTokensPerMonth: SUBSCRIPTION_PLANS[SubscriptionPlan.BASIC].maxTokensPerMonth,
      }
    })
    
    console.log(`✅ Created basic subscription for user ${userId}`)
    return newSubscription
  }

  return subscription
}

async function updateUserUsageToMax(userId: string, planName: PlanName) {
  const plan = SUBSCRIPTION_PLANS[planName]
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-based
  
  console.log(`🎯 Setting token usage to maximum for plan: ${planName}`)
  console.log(`📅 Target period: ${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
  
  // Check if current usage record exists for reference
  await prisma.userUsage.findUnique({
    where: {
      userId_year_month: {
        userId,
        year: currentYear,
        month: currentMonth
      }
    }
  })
  
  // Determine target token usage based on plan
  let targetTokens: number
  
  if (planName === SubscriptionPlan.BUSINESS) {
    // For business plan, use high but finite value
    targetTokens = 4000000  // Business plan limit
  } else {
    // For basic and pro plans, use plan limits
    targetTokens = plan.maxTokensPerMonth
  }
  
  // Set token usage to maximum
  console.log(`📊 Setting TOKENS to maximum:`)
  console.log(`   Tokens: ${targetTokens.toLocaleString()} (at limit)`)
  
  // Upsert the usage record for the current month
  const updatedUsage = await prisma.userUsage.upsert({
    where: {
      userId_year_month: {
        userId,
        year: currentYear,
        month: currentMonth
      }
    },
    update: {
      tokensUsed: targetTokens,
      updatedAt: now
    },
    create: {
      userId,
      year: currentYear,
      month: currentMonth,
      tokensUsed: targetTokens,
    }
  })
  
  return updatedUsage
}

async function updateUserSubscriptionPlan(userId: string, planName: PlanName) {
  const plan = SUBSCRIPTION_PLANS[planName]
  
  const updatedSubscription = await prisma.userSubscription.update({
    where: { userId },
    data: {
      plan: planName,
      maxClients: plan.maxClients,
      maxTokensPerMonth: plan.maxTokensPerMonth,
      updatedAt: new Date()
    }
  })
  
  console.log(`✅ Updated user subscription to ${planName} plan`)
  return updatedSubscription
}

async function main() {
  console.log('🚀 Starting usage limit testing setup...\n')
  
  try {
    const { userId, planName, limitType } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log(`📋 Plan: ${planName}`)
    console.log(`📏 Limit Type: ${limitType}`)
    console.log('')
    
    // Step 1: Ensure user has a subscription and update to correct plan
    console.log('📝 Step 1: Checking and updating user subscription...')
    await getUserSubscription(userId)
    await updateUserSubscriptionPlan(userId, planName)
    
    // Step 2: Set usage to maximum for the plan
    console.log(`\n📊 Step 2: Setting ${limitType} usage to maximum limits...`)
    const updatedUsage = await updateUserUsageToMax(userId, planName)
    
    console.log(`\n✅ Success! Token usage set to maximum.`)
    console.log('\n📋 Final Usage Summary:')
    console.log(`   User ID: ${userId}`)
    console.log(`   Plan: ${planName}`)
    console.log(`   Limit Type: ${limitType}`)
    console.log(`   Period: ${updatedUsage.year}-${updatedUsage.month.toString().padStart(2, '0')}`)
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