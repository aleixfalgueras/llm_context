#!/usr/bin/env tsx
/**
 * Reset Apprentice Users Script
 *
 * This script resets all Apprentice (free tier) users to the proper state:
 * - Sets spending limit to 0 (no AI usage allowed)
 * - Clears Stripe subscription fields (keeps customerId for future upgrades)
 * - Sets status to active (permanent free plan)
 * - Deletes all usage records
 *
 * Usage:
 *   npx tsx resources/scripts/testing/reset-apprentice-users.ts           # Dry run (preview only)
 *   npx tsx resources/scripts/testing/reset-apprentice-users.ts --execute # Execute changes
 */

import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Far future date for "permanent" free subscriptions (since field is not nullable)
const FAR_FUTURE_DATE = new Date('9999-12-31T23:59:59.999Z')

async function resetApprenticeUsers(dryRun: boolean = true) {
  console.log(`\n🔍 ${dryRun ? '[DRY RUN] ' : ''}Finding Apprentice users to reset...\n`)

  // Find all Apprentice users
  const apprenticeUsers = await prisma.userSubscription.findMany({
    where: {
      plan: SubscriptionPlan.apprentice
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  if (apprenticeUsers.length === 0) {
    console.log('ℹ️  No Apprentice users found')
    return
  }

  console.log(`📋 Found ${apprenticeUsers.length} Apprentice user(s):\n`)
  console.log('─'.repeat(80))

  // Show preview of each user
  for (const user of apprenticeUsers) {
    console.log(`👤 User ID: ${user.userId}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Stripe Customer ID: ${user.stripeCustomerId || 'None'} ${user.stripeCustomerId ? '(will keep)' : ''}`)
    console.log(`   Stripe Subscription ID: ${user.stripeSubscriptionId || 'None'} ${user.stripeSubscriptionId ? '→ will clear' : ''}`)
    console.log(`   Spending Limit: $${user.spending_limit_usd} ${user.spending_limit_usd > 0 ? '→ will set to 0' : ''}`)
    console.log(`   Custom Limit: ${user.custom_spending_limit_usd !== null ? `$${user.custom_spending_limit_usd} → will clear` : 'None'}`)
    console.log(`   Cancel at Period End: ${user.cancelAtPeriodEnd} ${user.cancelAtPeriodEnd ? '→ will set to false' : ''}`)
    console.log(`   Pending Plan Change: ${user.pendingPlanChange || 'None'} ${user.pendingPlanChange ? '→ will clear' : ''}`)
    console.log(`   Period End: ${user.currentPeriodEnd.toISOString()} → will set to 9999-12-31`)
    console.log('─'.repeat(80))
  }

  // Count usage records to be deleted
  const userIds = apprenticeUsers.map(u => u.userId)
  const usageCount = await prisma.userUsage.count({
    where: {
      userId: { in: userIds }
    }
  })

  console.log(`\n📊 Usage records to delete: ${usageCount}`)

  if (dryRun) {
    console.log('\n' + '═'.repeat(80))
    console.log('📝 SUMMARY OF CHANGES (DRY RUN - no changes made)')
    console.log('═'.repeat(80))
    console.log('\n  UserSubscription updates:')
    console.log('    • status → "active"')
    console.log('    • spending_limit_usd → 0')
    console.log('    • custom_spending_limit_usd → null')
    console.log('    • stripeSubscriptionId → null (keeping stripeCustomerId)')
    console.log('    • stripePriceId → null')
    console.log('    • stripeScheduleId → null')
    console.log('    • cancelAtPeriodEnd → false')
    console.log('    • pendingPlanChange → null')
    console.log('    • currentPeriodEnd → 9999-12-31')
    console.log('    • canceledAt → null')
    console.log('\n  UserUsage deletions:')
    console.log(`    • ${usageCount} record(s) will be deleted`)
    console.log('\n💡 To execute these changes, run with --execute flag:')
    console.log('   npx tsx resources/scripts/testing/reset-apprentice-users.ts --execute\n')
    return
  }

  // Execute updates
  console.log('\n🚀 Executing updates...\n')

  // 1. Update UserSubscription records
  const updateResult = await prisma.userSubscription.updateMany({
    where: {
      plan: SubscriptionPlan.apprentice
    },
    data: {
      status: SubscriptionStatus.active,
      spending_limit_usd: 0,
      custom_spending_limit_usd: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeScheduleId: null,
      cancelAtPeriodEnd: false,
      pendingPlanChange: null,
      currentPeriodEnd: FAR_FUTURE_DATE,
      canceledAt: null
      // Note: billingInterval kept as-is (not nullable, value irrelevant for free users)
      // Note: stripeCustomerId kept for potential future upgrades
    }
  })

  console.log(`✅ Updated ${updateResult.count} UserSubscription record(s)`)

  // 2. Delete UserUsage records for these users
  const usageDeleteResult = await prisma.userUsage.deleteMany({
    where: {
      userId: { in: userIds }
    }
  })

  console.log(`✅ Deleted ${usageDeleteResult.count} UserUsage record(s)`)

  console.log('\n🎉 Reset completed successfully!')
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  console.log('═'.repeat(80))
  if (dryRun) {
    console.log('   RESET APPRENTICE USERS - DRY RUN MODE')
    console.log('   (No changes will be made, preview only)')
  } else {
    console.log('   RESET APPRENTICE USERS - EXECUTE MODE')
    console.log('   ⚠️  Changes will be applied to the database!')
  }
  console.log('═'.repeat(80))

  await resetApprenticeUsers(dryRun)
}

main()
  .catch((e) => {
    console.error('\n💥 Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✨ Database connection closed')
  })
