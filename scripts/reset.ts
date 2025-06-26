#!/usr/bin/env tsx
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
  console.log('🚀 Starting database reset process...\n')
  
  try {
    // Reset the database
    await resetDatabase()
    
    console.log('\n🎉 Database reset completed successfully!')
    console.log('📝 Note: Template prompts are available as hard-coded templates in the UI')
    
  } catch (error) {
    console.error('\n💥 Error during reset process:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(() => {
    console.log('✨ Process completed')
  }) 