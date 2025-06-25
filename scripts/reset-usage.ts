#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ScriptArgs {
  userId: string
}

function parseArguments(): ScriptArgs {
  const args = process.argv.slice(2)
  
  if (args.length !== 1) {
    console.error('❌ Usage: tsx scripts/reset-usage.ts <userId>')
    console.error('   Example: tsx scripts/reset-usage.ts user_123abc')
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
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-based
  
  console.log(`🔄 Resetting usage for user: ${userId}`)
  console.log(`📅 Target period: ${currentYear}-${currentMonth.toString().padStart(2, '0')}`)
  
  // Reset the usage record for the current month
  const updatedUsage = await prisma.userUsage.upsert({
    where: {
      userId_year_month: {
        userId,
        year: currentYear,
        month: currentMonth
      }
    },
    update: {
      documentsGenerated: 0,
      tokensUsed: 0,
      estimatedCost: 0.0,
      updatedAt: now
    },
    create: {
      userId,
      year: currentYear,
      month: currentMonth,
      documentsGenerated: 0,
      tokensUsed: 0,
      estimatedCost: 0.0
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
    console.log(`   Period: ${updatedUsage.year}-${updatedUsage.month.toString().padStart(2, '0')}`)
    console.log(`   Documents Generated: ${updatedUsage.documentsGenerated}`)
    console.log(`   Tokens Used: ${updatedUsage.tokensUsed.toLocaleString()}`)
    console.log(`   Estimated Cost: $${updatedUsage.estimatedCost.toFixed(2)}`)
    
    console.log('\n🧪 Testing Tips:')
    console.log('   • User can now create documents again')
    console.log('   • All limits have been reset for the current month')
    console.log('   • Use set-usage-to-max.ts to set limits back to maximum')
    
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