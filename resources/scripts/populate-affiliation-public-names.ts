/**
 * Migration script to populate publicName field for existing affiliation records
 * Usage: npx tsx resources/scripts/populate-affiliation-public-names.ts [--dry-run]
 */

import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import { Affiliation } from '@prisma/client'

// Configuration
const BATCH_SIZE = 10 // Process 10 records at a time
const DELAY_BETWEEN_BATCHES = 500 // 500ms delay between batches to respect rate limits

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run')

// Statistics tracking
let totalProcessed = 0
let successCount = 0
let failureCount = 0
let skippedCount = 0
const failedUserIds: string[] = []

/**
 * Calculate public name from Clerk user data
 */
function calculatePublicName(user: any): string | null {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  } else if (user.firstName) {
    return user.firstName
  } else if (user.emailAddresses && user.emailAddresses.length > 0) {
    return user.emailAddresses[0].emailAddress
  }
  // Return null if no suitable data available
  return null
}

/**
 * Process a single affiliation record
 */
async function processAffiliation(affiliation: Affiliation, client: any): Promise<void> {
  try {
    // Fetch user data from Clerk
    const user = await client.users.getUser(affiliation.userId)
    
    // Calculate public name
    const publicName = calculatePublicName(user)
    
    if (!publicName) {
      console.log(`  ⚠️  No suitable name found for user ${affiliation.userId}, skipping...`)
      skippedCount++
      return
    }
    
    if (isDryRun) {
      console.log(`  [DRY RUN] Would update affiliation ${affiliation.affiliationCode}: "${publicName}"`)
      successCount++
    } else {
      // Update the affiliation record
      await prisma.affiliation.update({
        where: { id: affiliation.id },
        data: { publicName }
      })
      console.log(`  ✓ Updated affiliation ${affiliation.affiliationCode}: "${publicName}"`)
      successCount++
    }
  } catch (error) {
    console.error(`  ✗ Failed to process affiliation ${affiliation.affiliationCode}:`, error)
    failureCount++
    failedUserIds.push(affiliation.userId)
  }
}

/**
 * Process affiliations in batches
 */
async function processBatch(affiliations: Affiliation[], client: any): Promise<void> {
  for (const affiliation of affiliations) {
    await processAffiliation(affiliation, client)
    totalProcessed++
    
    // Show progress every 10 records
    if (totalProcessed % 10 === 0) {
      console.log(`\nProgress: ${totalProcessed} records processed...`)
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('===========================================')
  console.log('Affiliation Public Name Population Script')
  console.log('===========================================')
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`)
  console.log('')
  
  try {
    // Initialize Clerk client
    const client = await clerkClient()
    
    // Count total affiliations needing update
    const totalCount = await prisma.affiliation.count({
      where: { publicName: null }
    })
    
    if (totalCount === 0) {
      console.log('✓ No affiliations need updating. All records have publicName populated.')
      return
    }
    
    console.log(`Found ${totalCount} affiliations without publicName`)
    console.log(`Processing in batches of ${BATCH_SIZE}...\n`)
    
    // Process affiliations in batches
    let offset = 0
    while (offset < totalCount) {
      // Fetch next batch
      const batch = await prisma.affiliation.findMany({
        where: { publicName: null },
        skip: offset,
        take: BATCH_SIZE,
        orderBy: { createdAt: 'asc' }
      })
      
      if (batch.length === 0) {
        break
      }
      
      console.log(`\nProcessing batch ${Math.floor(offset / BATCH_SIZE) + 1}...`)
      await processBatch(batch, client)
      
      offset += BATCH_SIZE
      
      // Add delay between batches to respect rate limits
      if (offset < totalCount) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
    // Display final summary
    console.log('\n===========================================')
    console.log('Migration Summary')
    console.log('===========================================')
    console.log(`Total processed: ${totalProcessed}`)
    console.log(`✓ Successfully updated: ${successCount}`)
    console.log(`⚠️  Skipped (no data): ${skippedCount}`)
    console.log(`✗ Failed: ${failureCount}`)
    
    if (failedUserIds.length > 0) {
      console.log('\nFailed User IDs:')
      failedUserIds.forEach(userId => console.log(`  - ${userId}`))
    }
    
    if (isDryRun) {
      console.log('\n[DRY RUN] No actual changes were made to the database.')
      console.log('Run without --dry-run flag to apply changes.')
    }
    
  } catch (error) {
    console.error('\n✗ Migration failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrate()
  .then(() => {
    console.log('\n✓ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Unexpected error:', error)
    process.exit(1)
  })