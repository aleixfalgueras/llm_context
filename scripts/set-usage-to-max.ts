#!/usr/bin/env tsx
/**
 * Usage Limit Testing Script
 * 
 * Sets a user's usage to the maximum limits for their subscription plan.
 * Can target specific limits (tokens, documents, cost) or all limits.
 * 
 * Usage: tsx scripts/set-usage-to-max.ts <userId> <planName> <limitType>
 * 
 * Examples:
 *   tsx scripts/set-usage-to-max.ts user_123 basic all       # Set all limits to max
 *   tsx scripts/set-usage-to-max.ts user_123 pro tokens     # Set only token limit to max
 *   tsx scripts/set-usage-to-max.ts user_123 business cost  # Set only cost limit to max
 */
import { PrismaClient } from '@prisma/client'
import { SUBSCRIPTION_PLANS } from '../lib/subscription-utils'

const prisma = new PrismaClient()

type PlanName = keyof typeof SUBSCRIPTION_PLANS
type LimitType = 'tokens' | 'documents' | 'cost' | 'all'

interface ScriptArgs {
  userId: string
  planName: PlanName
  limitType: LimitType
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 3) {
    console.error('❌ Usage: tsx scripts/set-usage-to-max.ts <userId> <planName> <limitType>')
    console.error('   planName must be one of: basic, pro, business')
    console.error('   limitType must be one of: tokens, documents, cost, all')
    console.error('   Examples:')
    console.error('     tsx scripts/set-usage-to-max.ts user_123abc basic all')
    console.error('     tsx scripts/set-usage-to-max.ts user_123abc pro tokens')
    console.error('     tsx scripts/set-usage-to-max.ts user_123abc business cost')
    process.exit(1)
  }

  const [userId, planName, limitType] = args
  
  if (!userId || userId.trim() === '') {
    console.error('❌ Error: userId cannot be empty')
    process.exit(1)
  }

  if (!Object.keys(SUBSCRIPTION_PLANS).includes(planName)) {
    console.error(`❌ Error: planName must be one of: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`)
    process.exit(1)
  }

  const validLimitTypes: LimitType[] = ['tokens', 'documents', 'cost', 'all']
  if (!validLimitTypes.includes(limitType as LimitType)) {
    console.error(`❌ Error: limitType must be one of: ${validLimitTypes.join(', ')}`)
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
        plan: 'basic',
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        maxClients: SUBSCRIPTION_PLANS.basic.maxClients,
        maxTokensPerMonth: SUBSCRIPTION_PLANS.basic.maxTokensPerMonth,
      }
    })
    
    console.log(`✅ Created basic subscription for user ${userId}`)
    return newSubscription
  }

  return subscription
}

async function updateUserUsageToMax(userId: string, planName: PlanName, limitType: LimitType) {
  const plan = SUBSCRIPTION_PLANS[planName]
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-based
  
  console.log(`🎯 Setting ${limitType} usage to maximum for plan: ${planName}`)
  console.log(`📅 Target period: ${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
  
  // Get current usage to preserve limits we're not targeting
  const currentUsage = await prisma.userUsage.findUnique({
    where: {
      userId_year_month: {
        userId,
        year: currentYear,
        month: currentMonth
      }
    }
  })
  
  // Start with current values or 0
  let documentsGenerated = currentUsage?.documentsGenerated || 0
  let tokensUsed = currentUsage?.tokensUsed || 0
  
  // Determine target values based on plan and limit type
  let targetDocuments: number
  let targetTokens: number
  
  if (planName === 'business') {
    // For business plan, use high but finite values for unlimited fields
    targetDocuments = 1000  // High but finite number (since unlimited = -1 in DB)
    targetTokens = 10000000  // High but finite number (since unlimited = -1 in DB)
  } else {
    // For basic and pro plans, use high values (since no document limits exist)
    targetDocuments = 1000  // Simulated high usage for testing
    targetTokens = plan.maxTokensPerMonth
  }
  
  // Set specific limit(s) to maximum based on limitType
  switch (limitType) {
    case 'documents':
      documentsGenerated = targetDocuments
      console.log(`📊 Setting DOCUMENTS to maximum:`)
      console.log(`   Documents: ${documentsGenerated} (at limit)`)
      console.log(`   Tokens: ${tokensUsed.toLocaleString()} (preserved)`)
      break
      
    case 'tokens':
      tokensUsed = targetTokens
      console.log(`📊 Setting TOKENS to maximum:`)
      console.log(`   Documents: ${documentsGenerated} (preserved)`)
      console.log(`   Tokens: ${tokensUsed.toLocaleString()} (at limit)`)
      break
      
    case 'cost':
      console.log(`⚠️  Cost tracking removed - OpenRouter handles billing automatically`)
      console.log(`   No action taken for cost limit`)
      break
      
    case 'all':
      documentsGenerated = targetDocuments
      tokensUsed = targetTokens
      
      if (planName === 'business') {
        console.log(`📊 Business plan - setting document and token limits to maximum:`)
        console.log(`   Documents: ${documentsGenerated} (simulating heavy usage)`)
        console.log(`   Tokens: ${tokensUsed.toLocaleString()} (simulating heavy usage)`)
      } else {
        console.log(`📊 ${planName} plan - setting document and token limits to maximum:`)
        console.log(`   Documents: ${documentsGenerated} (unlimited)`)
        console.log(`   Tokens: ${tokensUsed.toLocaleString()}/${plan.maxTokensPerMonth.toLocaleString()}`)
      }
      break
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
      updatedAt: now
    },
    create: {
      userId,
      year: currentYear,
      month: currentMonth,
      documentsGenerated,
      tokensUsed,
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
    const updatedUsage = await updateUserUsageToMax(userId, planName, limitType)
    
    console.log(`\n✅ Success! ${limitType === 'all' ? 'All limits' : limitType.charAt(0).toUpperCase() + limitType.slice(1) + ' limit'} set to maximum.`)
    console.log('\n📋 Final Usage Summary:')
    console.log(`   User ID: ${userId}`)
    console.log(`   Plan: ${planName}`)
    console.log(`   Limit Type: ${limitType}`)
    console.log(`   Period: ${updatedUsage.year}-${updatedUsage.month.toString().padStart(2, '0')}`)
    console.log(`   Documents Generated: ${updatedUsage.documentsGenerated}`)
    console.log(`   Tokens Used: ${updatedUsage.tokensUsed.toLocaleString()}`)
    
    console.log('\n🧪 Testing Tips:')
    
    switch (limitType) {
      case 'documents':
        console.log('   • Try creating a new document - it should be blocked by document limit')
        console.log('   • Token and cost limits should still work normally')
        break
      case 'tokens':
        console.log('   • Try creating content that uses many tokens - it should be blocked by token limit')
        console.log('   • Document and cost limits should still work normally')
        break
      case 'cost':
        console.log('   • Try using expensive models (GPT-4o) - it should be blocked by cost limit')
        console.log('   • Document and token limits should still work normally')
        break
      case 'all':
        console.log('   • Try creating a new document - it should be blocked')
        console.log('   • All limits should show maximum usage warnings')
        break
    }
    
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