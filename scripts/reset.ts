#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Valid table names that can be preserved
const VALID_TABLES = [
  'messages',
  'chats', 
  'documents',
  'clients',
  'prompts',
  'feedback',
  'consentAuditLog',
  'userConsent',
  'dataExportRequest',
  'userUsage',
  'userSubscription'
] as const

function parseArguments(): string[] {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    return []
  }
  
  // Validate table names
  const invalidTables = args.filter(table => !VALID_TABLES.includes(table as any))
  if (invalidTables.length > 0) {
    console.warn(`⚠️  Invalid table names: ${invalidTables.join(', ')}`)
    console.warn(`   Valid tables: ${VALID_TABLES.join(', ')}`)
  }
  
  // Return only valid table names
  const validTables = args.filter(table => VALID_TABLES.includes(table as any))
  return validTables
}

async function clearDatabaseData(tablesToKeep: string[] = []) {
  console.log('🗄️  Clearing database data...')
  
  // Show which tables are being preserved
  if (tablesToKeep.length > 0) {
    console.log(`ℹ️  Preserving ${tablesToKeep.length} table${tablesToKeep.length > 1 ? 's' : ''}: ${tablesToKeep.join(', ')}`)
  }
  
  try {
    // Define table clearing operations in foreign key dependency order
    const tableOperations = [
      {
        name: 'messages',
        emoji: '📋',
        operation: () => prisma.message.deleteMany({}),
        description: 'messages'
      },
      {
        name: 'chats',
        emoji: '💬',
        operation: () => prisma.chat.deleteMany({}),
        description: 'chats'
      },
      {
        name: 'documents',
        emoji: '📄',
        operation: () => prisma.document.deleteMany({}),
        description: 'documents'
      },
      {
        name: 'clients',
        emoji: '👥',
        operation: () => prisma.client.deleteMany({}),
        description: 'clients'
      },
      {
        name: 'prompts',
        emoji: '📝',
        operation: () => prisma.prompt.deleteMany({}),
        description: 'prompts'
      },
      {
        name: 'feedback',
        emoji: '📞',
        operation: () => prisma.feedback.deleteMany({}),
        description: 'feedback'
      },
      {
        name: 'consentAuditLog',
        emoji: '📊',
        operation: () => prisma.consentAuditLog.deleteMany({}),
        description: 'consent audit logs'
      },
      {
        name: 'userConsent',
        emoji: '🔒',
        operation: () => prisma.userConsent.deleteMany({}),
        description: 'user consent'
      },
      {
        name: 'dataExportRequest',
        emoji: '📦',
        operation: () => prisma.dataExportRequest.deleteMany({}),
        description: 'data export requests'
      },
      {
        name: 'userUsage',
        emoji: '📈',
        operation: () => prisma.userUsage.deleteMany({}),
        description: 'user usage'
      },
      {
        name: 'userSubscription',
        emoji: '💳',
        operation: () => prisma.userSubscription.deleteMany({}),
        description: 'user subscriptions'
      }
    ]
    
    // Execute operations, skipping tables in tablesToKeep
    for (const table of tableOperations) {
      if (tablesToKeep.includes(table.name)) {
        console.log(`  ⏭️  Skipping ${table.description} (preserved by user)`)
      } else {
        console.log(`  ${table.emoji} Clearing ${table.description}...`)
        await table.operation()
      }
    }
    
    const clearedCount = tableOperations.length - tablesToKeep.length
    console.log(`✅ Database clearing completed: ${clearedCount} table${clearedCount !== 1 ? 's' : ''} cleared, ${tablesToKeep.length} preserved`)
  } catch (error) {
    console.error('❌ Error clearing database data:', error)
    throw error
  }
}

async function clearDocumentsBucket() {
  console.log('🗂️  Clearing documents bucket...')
  try {
    // Check if Supabase environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Supabase environment variables not found, skipping bucket clearing')
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'
    
    // List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
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
    const { error: deleteError } = await supabase.storage
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
    // Parse command line arguments to get tables to preserve
    const tablesToKeep = parseArguments()
    
    // Clear database data (preserving schema, migrations, and specified tables)
    await clearDatabaseData(tablesToKeep)
    
    // Clear documents storage bucket (unless documents table is preserved)
    if (!tablesToKeep.includes('documents')) {
      await clearDocumentsBucket()
    } else {
      console.log('🗂️  Skipping documents bucket clearing (documents table preserved)')
    }
    
    console.log('\n🎉 Reset completed successfully!')
    console.log('📝 Note: Database schema and migrations preserved')
    if (tablesToKeep.length > 0) {
      console.log(`📝 Note: Data preserved in ${tablesToKeep.length} table${tablesToKeep.length > 1 ? 's' : ''}: ${tablesToKeep.join(', ')}`)
    }
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
  .finally(async () => {
    await prisma.$disconnect()
    console.log('✨ Process completed')
  }) 