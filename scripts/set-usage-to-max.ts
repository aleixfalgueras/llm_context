#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { SUBSCRIPTION_PLANS } from '../lib/subscription-utils'

const prisma = new PrismaClient()

type PlanName = keyof typeof SUBSCRIPTION_PLANS

interface ScriptArgs {
  userId: string
  planName: PlanName
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.error('❌ Usage: tsx scripts/set-usage-to-max.ts <userId> <planName>')
    console.error('   planName must be one of: basic, pro, business')
    console.error('   Example: tsx scripts/set-usage-to-max.ts user_123abc basic')
    process.exit(1)
  }

  const [userId, planName] = args
  
  if (!userId || userId.trim() === '') {
    console.error('❌ Error: userId cannot be empty')
    process.exit(1)
  }

  if (!Object.keys(SUBSCRIPTION_PLANS).includes(planName)) {
    console.error(`❌ Error: planName must be one of: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`)
    process.exit(1)
  }

  return {
    userId: userId.trim(),
    planName: planName as PlanName
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
        plan: 'basic',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxClients: SUBSCRIPTION_PLANS.basic.maxClients,
        maxDocumentsPerMonth: SUBSCRIPTION_PLANS.basic.maxDocumentsPerMonth,
        maxTokensPerMonth: SUBSCRIPTION_PLANS.basic.maxTokensPerMonth,
        maxCostPerMonth: SUBSCRIPTION_PLANS.basic.maxCostPerMonth,
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
  
  console.log(`🎯 Setting usage to maximum for plan: ${planName}`)
  console.log(`📅 Target period: ${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
  
  // For unlimited plans (business), we'll set high values for testing
  // but not truly unlimited since we need actual numbers
  let documentsGenerated: number
  let tokensUsed: number
  let estimatedCost: number
  
  if (planName === 'business') {
    // For business plan, set high values that would simulate heavy usage
    documentsGenerated = 1000  // Very high number to simulate unlimited usage
    tokensUsed = 10000000     // 10M tokens - very high usage
    estimatedCost = 100.00    // $100 - high cost but reasonable for business
    
    console.log(`📊 Business plan - setting high usage values:`)
    console.log(`   Documents: ${documentsGenerated} (simulating heavy usage)`)
    console.log(`   Tokens: ${tokensUsed.toLocaleString()} (simulating heavy usage)`)
    console.log(`   Cost: $${estimatedCost} (simulating heavy usage)`)
  } else {
    // For basic and pro plans, set to exact maximum limits
    documentsGenerated = plan.maxDocumentsPerMonth
    tokensUsed = plan.maxTokensPerMonth
    estimatedCost = plan.maxCostPerMonth
    
    console.log(`📊 ${planName} plan - setting to maximum limits:`)
    console.log(`   Documents: ${documentsGenerated}/${plan.maxDocumentsPerMonth}`)
    console.log(`   Tokens: ${tokensUsed.toLocaleString()}/${plan.maxTokensPerMonth.toLocaleString()}`)
    console.log(`   Cost: $${estimatedCost}/$${plan.maxCostPerMonth}`)
  }
  
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
      documentsGenerated,
      tokensUsed,
      estimatedCost,
      updatedAt: now
    },
    create: {
      userId,
      year: currentYear,
      month: currentMonth,
      documentsGenerated,
      tokensUsed,
      estimatedCost
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
      maxDocumentsPerMonth: plan.maxDocumentsPerMonth,
      maxTokensPerMonth: plan.maxTokensPerMonth,
      maxCostPerMonth: plan.maxCostPerMonth,
      updatedAt: new Date()
    }
  })
  
  console.log(`✅ Updated user subscription to ${planName} plan`)
  return updatedSubscription
}

async function main() {
  console.log('🚀 Starting usage limit testing setup...\n')
  
  try {
    const { userId, planName } = parseArguments()
    
    console.log(`👤 User ID: ${userId}`)
    console.log(`📋 Plan: ${planName}`)
    console.log('')
    
    // Step 1: Ensure user has a subscription and update to correct plan
    console.log('📝 Step 1: Checking and updating user subscription...')
    await getUserSubscription(userId)
    await updateUserSubscriptionPlan(userId, planName)
    
    // Step 2: Set usage to maximum for the plan
    console.log('\n📊 Step 2: Setting usage to maximum limits...')
    const updatedUsage = await updateUserUsageToMax(userId, planName)
    
    console.log('\n✅ Success! Usage has been set to maximum limits.')
    console.log('\n📋 Final Usage Summary:')
    console.log(`   User ID: ${userId}`)
    console.log(`   Plan: ${planName}`)
    console.log(`   Period: ${updatedUsage.year}-${updatedUsage.month.toString().padStart(2, '0')}`)
    console.log(`   Documents Generated: ${updatedUsage.documentsGenerated}`)
    console.log(`   Tokens Used: ${updatedUsage.tokensUsed.toLocaleString()}`)
    console.log(`   Estimated Cost: $${updatedUsage.estimatedCost.toFixed(2)}`)
    
    console.log('\n🧪 Testing Tips:')
    console.log('   • Try creating a new document - it should be blocked')
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