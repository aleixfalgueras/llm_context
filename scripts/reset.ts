#!/usr/bin/env tsx
import { exec } from 'child_process'
import { promisify } from 'util'
import { supabaseServer } from '../lib/supabase'

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

async function clearDocumentsBucket() {
  console.log('🗂️  Clearing documents bucket...')
  try {
    const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'
    
    // List all files in the bucket
    const { data: files, error: listError } = await supabaseServer.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.error('❌ Error listing files from bucket:', listError)
      throw listError
    }

    if (!files || files.length === 0) {
      console.log('ℹ️  Documents bucket is already empty')
      return
    }

    console.log(`📋 Found ${files.length} files to delete`)

    // Extract file paths (exclude folders)
    const filePaths = files
      .filter(file => file.name && !file.name.endsWith('/'))
      .map(file => file.name)

    if (filePaths.length === 0) {
      console.log('ℹ️  No files to delete (only folders found)')
      return
    }

    // Delete all files
    const { error: deleteError } = await supabaseServer.storage
      .from(bucketName)
      .remove(filePaths)

    if (deleteError) {
      console.error('❌ Error deleting files from bucket:', deleteError)
      throw deleteError
    }

    console.log(`✅ Successfully deleted ${filePaths.length} files from documents bucket`)
  } catch (error) {
    console.error('❌ Error clearing documents bucket:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting reset process...\n')
  
  try {
    // Reset the database
    await resetDatabase()
    
    // Clear documents storage bucket
    await clearDocumentsBucket()
    
    console.log('\n🎉 Reset completed successfully!')
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