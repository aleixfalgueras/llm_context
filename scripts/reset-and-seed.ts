#!/usr/bin/env tsx
import { exec } from 'child_process'
import { promisify } from 'util'
import { seedPrompts } from './seed-prompts'

const execAsync = promisify(exec)

// System user ID for seeding - in real apps this would be an admin user
const SYSTEM_USER_ID = 'system_seed_user'

async function resetDatabase() {
  console.log('🗄️  Resetting database...')
  try {
    await execAsync('npx prisma db push --force-reset')
    console.log('✅ Database reset completed')
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    throw error
  }
}



async function main() {
  console.log('🚀 Starting database reset and seed process...\n')
  
  try {
    // Step 1: Reset the database
    await resetDatabase()
    
    // Step 2: Seed with sample prompts using the imported seedPrompts function
    const promptCount = await seedPrompts(SYSTEM_USER_ID)
    
    console.log('\n🎉 Database reset and seed process completed successfully!')
    console.log(`📊 Created ${promptCount} sample prompts`)
    
  } catch (error) {
    console.error('\n💥 Error during reset and seed process:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(() => {
    // No need to disconnect prisma here since it's handled in seed-prompts.ts
    console.log('✨ Process completed')
  }) 