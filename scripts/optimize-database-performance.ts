#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables from specified file or default .env
const envFile = process.argv[2] || '.env'
const envPath = path.resolve(process.cwd(), envFile)

console.log(`📁 Loading environment variables from: ${envPath}`)
const result = config({ path: envPath })

if (result.error) {
  console.error(`❌ Error loading environment file: ${result.error.message}`)
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('💡 Make sure your environment file contains DATABASE_URL')
  process.exit(1)
}

console.log(`✅ Database URL loaded: ${process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)

const prisma = new PrismaClient()

interface IndexInfo {
  indexrelname: string
  schemaname: string
  relname: string  
  idx_scan: number
  idx_tup_read: number
  idx_tup_fetch: number
}

interface TableSize {
  schemaname: string
  tablename: string
  size: string
  size_bytes: number
}

/**
 * Database Performance Optimization Script
 * 
 * This script:
 * 1. Applies database indexes for optimal query performance
 * 2. Provides performance monitoring and analysis
 * 3. Gives recommendations for further optimization
 */

async function main() {
  console.log('🚀 Starting Database Performance Optimization...\n')
  
  // Show usage if help is requested
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: npx tsx scripts/optimize-database-performance.ts [env-file]')
    console.log('')
    console.log('Arguments:')
    console.log('  env-file    Path to environment file (default: .env)')
    console.log('')
    console.log('Examples:')
    console.log('  npx tsx scripts/optimize-database-performance.ts')
    console.log('  npx tsx scripts/optimize-database-performance.ts .env.local')
    console.log('  npx tsx scripts/optimize-database-performance.ts .env.production')
    process.exit(0)
  }

  try {
    // Read and execute the SQL optimization script
    await applyDatabaseIndexes()
    
    // Analyze current performance
    await analyzeCurrentPerformance()
    
    // Provide optimization recommendations
    await showOptimizationRecommendations()
    
    console.log('\n✅ Database optimization completed successfully!')
    console.log('\n📊 Run this script periodically to monitor performance metrics.')
    
  } catch (error) {
    console.error('\n💥 Error during optimization:', error)
    if (error instanceof Error) {
      console.error('Details:', error.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function applyDatabaseIndexes() {
  console.log('📋 Applying database indexes...')
  
  try {
    // Read the SQL optimization file
    const sqlPath = path.join(__dirname, 'optimize-database-performance.sql')
    const sqlContent = await fs.readFile(sqlPath, 'utf-8')
    
    // Extract CREATE INDEX statements properly
    const statements = []
    const lines = sqlContent.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('CREATE INDEX')) {
        // Multi-line CREATE INDEX statement
        let statement = line
        let j = i + 1
        
        // Continue reading lines until we find the semicolon
        while (j < lines.length && !statement.includes(';')) {
          const nextLine = lines[j].trim()
          if (nextLine && !nextLine.startsWith('--')) {
            statement += ' ' + nextLine
          }
          j++
        }
        
        // Clean up the statement and remove CONCURRENTLY (not supported in transactions)
        statement = statement.replace(/\s+/g, ' ').trim()
        statement = statement.replace(/CONCURRENTLY\s+/gi, '')
        if (statement.endsWith(';')) {
          statements.push(statement)
        }
        
        i = j - 1 // Skip the lines we've already processed
      }
    }
    
    console.log(`   Creating ${statements.length} indexes...`)
    
    for (const statement of statements) {
      try {
        const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
        console.log(`   📝 Creating: ${indexName}`)
        
        await prisma.$executeRawUnsafe(statement)
        console.log(`   ✅ Created: ${indexName}`)
      } catch (error) {
        // Index might already exist, that's okay
        if (error instanceof Error && error.message.includes('already exists')) {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
          console.log(`   ℹ️  Already exists: ${indexName}`)
        } else {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
          console.error(`   ❌ Failed to create ${indexName}:`, error instanceof Error ? error.message : String(error))
        }
      }
    }
    
    console.log('✅ Index creation completed\n')
    
  } catch (error) {
    console.error('Error applying indexes:', error)
    throw error
  }
}

async function analyzeCurrentPerformance() {
  console.log('📊 Analyzing current database performance...\n')
  
  try {
    // 1. Check index usage statistics
    console.log('🔍 Index Usage Statistics:')
    const indexStats = await prisma.$queryRaw<IndexInfo[]>`
      SELECT 
        schemaname, 
        relname, 
        indexrelname, 
        idx_scan, 
        idx_tup_read, 
        idx_tup_fetch 
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC 
      LIMIT 15;
    `
    
    indexStats.forEach(stat => {
      const usage = stat.idx_scan > 0 ? '✅ Used' : '⚠️  Unused'
      console.log(`   ${usage} ${stat.relname}.${stat.indexrelname} - Scans: ${stat.idx_scan.toLocaleString()}`)
    })
    
    // 2. Find unused indexes
    const unusedIndexes = await prisma.$queryRaw<IndexInfo[]>`
      SELECT schemaname, relname, indexrelname, idx_scan 
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public' AND idx_scan = 0
      AND indexrelname NOT LIKE '%_pkey' 
      AND indexrelname NOT LIKE '%_key';
    `
    
    if (unusedIndexes.length > 0) {
      console.log('\n⚠️  Unused Indexes (consider removing):')
      unusedIndexes.forEach(idx => {
        console.log(`   ${idx.relname}.${idx.indexrelname}`)
      })
    }
    
    // 3. Table and index sizes
    console.log('\n📏 Table Sizes:')
    const tableSizes = await prisma.$queryRaw<TableSize[]>`
      SELECT 
        tablename, 
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
        pg_total_relation_size(tablename::regclass) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY pg_total_relation_size(tablename::regclass) DESC;
    `
    
    tableSizes.forEach(table => {
      console.log(`   ${table.tablename}: ${table.size}`)
    })
    
    // 4. Query performance recommendations
    console.log('\n🎯 Performance Test Queries:')
    console.log('   Run these with EXPLAIN ANALYZE to verify index usage:')
    
    const testQueries = [
      "SELECT * FROM prompts WHERE userId = 'test' AND isActive = true ORDER BY usageCount DESC;",
      "SELECT * FROM user_usage WHERE userId = 'test' AND year = 2024 AND month = 12;",
      "SELECT * FROM documents WHERE userId = 'test' AND clientId = 'test' ORDER BY createdAt DESC;",
      "SELECT * FROM messages WHERE chatId = 'test' ORDER BY createdAt ASC;",
      "SELECT * FROM clients WHERE userId = 'test' ORDER BY createdAt DESC;"
    ]
    
    testQueries.forEach((query, i) => {
      console.log(`   ${i + 1}. ${query}`)
    })
    
  } catch (error) {
    console.error('Error analyzing performance:', error)
    throw error
  }
}

async function showOptimizationRecommendations() {
  console.log('\n💡 Additional Performance Optimization Recommendations:\n')
  
  // Get basic database statistics
  const stats = await getDatabaseStats()
  
  console.log('1. 🔗 Connection Pooling:')
  console.log('   • Use PgBouncer for connection pooling in production')
  console.log('   • Configure max connections based on your server capacity')
  console.log('   • Monitor connection usage with pg_stat_activity\n')
  
  console.log('2. 📈 Query Optimization:')
  console.log('   • Enable pg_stat_statements extension for query analysis')
  console.log('   • Regularly run EXPLAIN ANALYZE on slow queries')
  console.log('   • Consider query result caching for read-heavy operations\n')
  
  console.log('3. 🧹 Database Maintenance:')
  console.log('   • Set up automated VACUUM and ANALYZE schedules')
  console.log('   • Monitor table bloat and reindex when necessary')
  console.log('   • Keep PostgreSQL statistics up to date\n')
  
  console.log('4. 📊 Application-Level Optimizations:')
  console.log('   • Implement Redis caching for frequently accessed data')
  console.log('   • Use pagination for large data sets')
  console.log('   • Consider database read replicas for read-heavy workloads')
  console.log('   • Batch database operations where possible\n')
  
  console.log('5. 🔄 Specific to Your App:')
  if (stats.totalPrompts > 1000) {
    console.log('   • Consider archiving old/unused prompts')
  }
  if (stats.totalMessages > 10000) {
    console.log('   • Implement message retention policies for chat history')
  }
  if (stats.totalDocuments > 5000) {
    console.log('   • Consider document archival strategies')
  }
  console.log('   • Cache user subscription data (changes infrequently)')
  console.log('   • Pre-calculate usage statistics for dashboard views')
  console.log('   • Consider materialized views for complex analytics queries\n')
  
  console.log('6. 🎛️ Database Configuration:')
  console.log('   • Tune shared_buffers (25% of RAM typically)')
  console.log('   • Optimize work_mem for complex queries')
  console.log('   • Configure effective_cache_size appropriately')
  console.log('   • Enable and tune autovacuum settings\n')
  
  console.log('7. 📋 Monitoring Setup:')
  console.log('   • Set up query performance monitoring')
  console.log('   • Monitor index usage regularly')
  console.log('   • Track slow query logs')
  console.log('   • Set up alerts for database performance metrics\n')
}

async function getDatabaseStats() {
  // Batch all database operations for better performance
  const [
    totalUsers,
    totalClients,
    totalDocuments,
    totalChats,
    totalMessages,
    totalPrompts,
    totalFeedbacks,
    totalConsents,
    totalUsageRecords
  ] = await Promise.all([
    prisma.userSubscription.count(),
    prisma.client.count(),
    prisma.document.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.prompt.count(),
    prisma.feedback.count(),
    prisma.userConsent.count(),
    prisma.userUsage.count()
  ])
  
  return {
    totalUsers,
    totalClients,
    totalDocuments,
    totalChats,
    totalMessages,
    totalPrompts,
    totalFeedbacks,
    totalConsents,
    totalUsageRecords
  }
}

// Utility function to test query performance
export async function testQueryPerformance(query: string) {
  console.log(`\n🧪 Testing query performance:`)
  console.log(`Query: ${query}`)
  
  try {
    const startTime = Date.now()
    const result = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`)
    const endTime = Date.now()
    
    console.log(`Execution time: ${endTime - startTime}ms`)
    console.log('Query plan:', result)
  } catch (error) {
    console.error('Error testing query:', error)
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
}

export { main as optimizeDatabase } 