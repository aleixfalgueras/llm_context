#!/usr/bin/env tsx
import { PrismaClient, AffiliationStatus } from '@prisma/client'
import { AffiliationOperations } from '@/database/affiliation-operations'

const prisma = new PrismaClient()

// Available affiliation statuses for testing variety
const AFFILIATION_STATUSES = [
  AffiliationStatus.GenY,
  AffiliationStatus.Indigo,
  AffiliationStatus.LightWorker,
  AffiliationStatus.CristalClub,
  AffiliationStatus.D5Level,
  AffiliationStatus.Walkin,
  AffiliationStatus.SevenStars,
  AffiliationStatus.InfinityStars,
  AffiliationStatus.Alpha,
  AffiliationStatus.Omega
]

/**
 * Generate a unique affiliation code
 * Format: 6 random alphanumeric characters (uppercase)
 * Same algorithm as AffiliationService
 */
function generateAffiliationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

/**
 * Generate a unique affiliation code by checking database
 */
async function generateUniqueAffiliationCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const code = generateAffiliationCode()
    const existing = await AffiliationOperations.findAffiliationByCode(code)
    
    if (!existing.success || !existing.data) {
      return code
    }
    
    attempts++
  }
  
  throw new Error('Failed to generate unique affiliation code after maximum attempts')
}

/**
 * Parse and validate command line arguments
 */
function parseArguments(): { parentCode: string; count: number } {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('❌ Error: Parent affiliation code is required')
    console.log('Usage: npx tsx add-test-affiliates.ts <parentAffiliationCode> [count]')
    console.log('Example: npx tsx add-test-affiliates.ts ABC123 5')
    process.exit(1)
  }
  
  const parentCode = args[0].toUpperCase()
  const count = args[1] ? parseInt(args[1], 10) : 5
  
  if (isNaN(count) || count <= 0 || count > 50) {
    console.error('❌ Error: Count must be a number between 1 and 50')
    process.exit(1)
  }
  
  return { parentCode, count }
}

/**
 * Validate that parent affiliation code exists
 */
async function validateParentAffiliationCode(parentCode: string): Promise<void> {
  console.log(`🔍 Validating parent affiliation code: ${parentCode}`)
  
  const result = await AffiliationOperations.findAffiliationByCode(parentCode)
  
  if (!result.success) {
    console.error('❌ Error checking parent affiliation code:', result.error)
    throw new Error('Failed to validate parent affiliation code')
  }
  
  if (!result.data) {
    console.error(`❌ Error: Parent affiliation code "${parentCode}" not found in database`)
    console.log('💡 Make sure the parent affiliation code exists before creating children')
    throw new Error('Parent affiliation code not found')
  }
  
  console.log(`✅ Parent affiliation code "${parentCode}" found and valid`)
}

/**
 * Create test affiliates
 */
async function createTestAffiliates(parentCode: string, count: number): Promise<void> {
  console.log(`\n🏭 Creating ${count} test affiliates under parent code: ${parentCode}`)
  
  const createdAffiliates: Array<{
    userId: string
    affiliationCode: string
    status: AffiliationStatus
  }> = []
  
  for (let i = 1; i <= count; i++) {
    try {
      // Generate unique test user ID
      const userId = `test-user-${Date.now()}-${i.toString().padStart(3, '0')}`
      
      // Generate unique affiliation code
      const affiliationCode = await generateUniqueAffiliationCode()
      
      // Select random status for variety
      const status = AFFILIATION_STATUSES[Math.floor(Math.random() * AFFILIATION_STATUSES.length)]
      
      // Create the affiliation
      const result = await AffiliationOperations.createAffiliation({
        userId,
        affiliationCode,
        parentAffiliationCode: parentCode,
        status
      })
      
      if (!result.success) {
        console.error(`❌ Failed to create affiliate ${i}:`, result.error)
        continue
      }
      
      createdAffiliates.push({
        userId,
        affiliationCode,
        status
      })
      
      console.log(`  ✅ Created affiliate ${i}/${count}: ${affiliationCode} (${status}) for user ${userId}`)
      
      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error creating affiliate ${i}:`, error)
    }
  }
  
  return Promise.resolve()
}

/**
 * Display summary of created affiliates
 */
async function displaySummary(parentCode: string): Promise<void> {
  console.log(`\n📊 Summary of affiliates under parent code: ${parentCode}`)
  
  const childrenResult = await AffiliationOperations.findAffiliationChildren(parentCode)
  
  if (!childrenResult.success || !childrenResult.data) {
    console.error('❌ Failed to fetch affiliation children for summary')
    return
  }
  
  const children = childrenResult.data
  console.log(`📈 Total affiliates: ${children.length}`)
  
  // Group by status
  const statusCounts = children.reduce((acc, child) => {
    acc[child.status] = (acc[child.status] || 0) + 1
    return acc
  }, {} as Record<AffiliationStatus, number>)
  
  console.log('\n📋 Status distribution:')
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })
  
  console.log('\n🔗 Affiliation codes created:')
  children
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .forEach((child, index) => {
      const isNew = child.createdAt.getTime() > (Date.now() - 60000) // Created in last minute
      const indicator = isNew ? '🆕' : '📌'
      console.log(`  ${indicator} ${child.affiliationCode} (${child.status}) - User: ${child.userId}`)
    })
}

async function main() {
  console.log('🚀 Starting test affiliate creation process...\n')
  
  try {
    // Parse command line arguments
    const { parentCode, count } = parseArguments()
    
    console.log(`📝 Configuration:`)
    console.log(`  Parent Code: ${parentCode}`)
    console.log(`  Affiliates to create: ${count}`)
    console.log()
    
    // Validate parent affiliation code exists
    await validateParentAffiliationCode(parentCode)
    
    // Create test affiliates
    await createTestAffiliates(parentCode, count)
    
    // Display summary
    await displaySummary(parentCode)
    
    console.log('\n🎉 Test affiliate creation completed successfully!')
    
  } catch (error) {
    console.error('\n💥 Error during affiliate creation process:', error)
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
    console.log('✨ Process completed')
  })