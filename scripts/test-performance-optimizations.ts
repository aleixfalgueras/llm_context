#!/usr/bin/env tsx
/**
 * Test Performance Optimizations Script
 * 
 * This script tests the performance improvements from the application-level optimizations:
 * - Field selection
 * - Pagination
 * - Caching
 * - Batch operations
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'
import { getCacheStats, clearAllCaches } from '../lib/subscription-cache'

const prisma = new PrismaClient()

interface BenchmarkResult {
  operation: string
  beforeMs: number
  afterMs: number
  improvement: string
  cacheHits?: number
}

async function benchmarkOperation<T>(
  name: string, 
  operation: () => Promise<T>,
  iterations: number = 3
): Promise<{ result: T; averageMs: number }> {
  const times: number[] = []
  let result: T

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    result = await operation()
    const end = performance.now()
    times.push(end - start)
  }

  const averageMs = times.reduce((a, b) => a + b, 0) / times.length
  return { result: result!, averageMs }
}

async function testFieldSelection() {
  console.log('📊 Testing Field Selection Optimization...\n')

  // Test 1: Prompts API with field selection
  const testUserId = 'test_user_123'
  
  // Simulate old way (selecting all fields)
  const oldPromptsQuery = async () => {
    return await prisma.prompt.findMany({
      where: { userId: testUserId },
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ]
    })
  }

  // New way (with field selection)
  const newPromptsQuery = async () => {
    return await prisma.prompt.findMany({
      where: { userId: testUserId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
        usageCount: true,
        createdAt: true,
        updatedAt: true,
        // content field excluded for listing
      },
      orderBy: [
        { usageCount: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    })
  }

  try {
    const oldResult = await benchmarkOperation('Old Prompts Query', oldPromptsQuery)
    const newResult = await benchmarkOperation('New Prompts Query', newPromptsQuery)

    const improvement = ((oldResult.averageMs - newResult.averageMs) / oldResult.averageMs * 100).toFixed(1)

    console.log(`   Old Query (all fields): ${oldResult.averageMs.toFixed(2)}ms`)
    console.log(`   New Query (selected fields): ${newResult.averageMs.toFixed(2)}ms`)
    console.log(`   Improvement: ${improvement}% faster\n`)

    return {
      operation: 'Prompts Field Selection',
      beforeMs: oldResult.averageMs,
      afterMs: newResult.averageMs,
      improvement: `${improvement}% faster`
    }
  } catch (error) {
    console.log(`   ⚠️  Could not test (no data): ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    return null
  }
}

async function testCaching() {
  console.log('⚡ Testing Subscription Caching...\n')

  const testUserId = 'test_user_456'
  
  // Clear cache first
  clearAllCaches()

  const { getUserSubscription, getCurrentMonthUsage } = await import('../lib/subscription-utils')

  // First call (cache miss)
  const firstCall = await benchmarkOperation('First Subscription Call', async () => {
    return await getUserSubscription(testUserId)
  }, 1)

  // Second call (cache hit)
  const secondCall = await benchmarkOperation('Second Subscription Call', async () => {
    return await getUserSubscription(testUserId)
  }, 1)

  // Usage call cache test
  const firstUsageCall = await benchmarkOperation('First Usage Call', async () => {
    return await getCurrentMonthUsage(testUserId)
  }, 1)

  const secondUsageCall = await benchmarkOperation('Second Usage Call', async () => {
    return await getCurrentMonthUsage(testUserId)
  }, 1)

  const cacheStats = getCacheStats()

  console.log(`   First subscription call: ${firstCall.averageMs.toFixed(2)}ms`)
  console.log(`   Second subscription call: ${secondCall.averageMs.toFixed(2)}ms`)
  console.log(`   First usage call: ${firstUsageCall.averageMs.toFixed(2)}ms`)
  console.log(`   Second usage call: ${secondUsageCall.averageMs.toFixed(2)}ms`)
  console.log(`   Cache stats: ${JSON.stringify(cacheStats)}\n`)

  const subscriptionImprovement = ((firstCall.averageMs - secondCall.averageMs) / firstCall.averageMs * 100).toFixed(1)
  const usageImprovement = ((firstUsageCall.averageMs - secondUsageCall.averageMs) / firstUsageCall.averageMs * 100).toFixed(1)

  return [
    {
      operation: 'Subscription Caching',
      beforeMs: firstCall.averageMs,
      afterMs: secondCall.averageMs,
      improvement: `${subscriptionImprovement}% faster`,
      cacheHits: cacheStats.subscription.total
    },
    {
      operation: 'Usage Caching',
      beforeMs: firstUsageCall.averageMs,
      afterMs: secondUsageCall.averageMs,
      improvement: `${usageImprovement}% faster`,
      cacheHits: cacheStats.usage.total
    }
  ]
}

async function testBatchOperations() {
  console.log('🔄 Testing Batch Operations...\n')

  // Test sequential vs parallel operations
  const sequentialQuery = async () => {
    const users = await prisma.userSubscription.count()
    const clients = await prisma.client.count()
    const documents = await prisma.document.count()
    const prompts = await prisma.prompt.count()
    return { users, clients, documents, prompts }
  }

  const parallelQuery = async () => {
    const [users, clients, documents, prompts] = await Promise.all([
      prisma.userSubscription.count(),
      prisma.client.count(),
      prisma.document.count(),
      prisma.prompt.count()
    ])
    return { users, clients, documents, prompts }
  }

  const sequentialResult = await benchmarkOperation('Sequential Queries', sequentialQuery)
  const parallelResult = await benchmarkOperation('Parallel Queries', parallelQuery)

  const improvement = ((sequentialResult.averageMs - parallelResult.averageMs) / sequentialResult.averageMs * 100).toFixed(1)

  console.log(`   Sequential queries: ${sequentialResult.averageMs.toFixed(2)}ms`)
  console.log(`   Parallel queries: ${parallelResult.averageMs.toFixed(2)}ms`)
  console.log(`   Improvement: ${improvement}% faster\n`)

  return {
    operation: 'Batch Operations',
    beforeMs: sequentialResult.averageMs,
    afterMs: parallelResult.averageMs,
    improvement: `${improvement}% faster`
  }
}

async function main() {
  console.log('🚀 Testing Application-Level Performance Optimizations\n')
  console.log('=' .repeat(60) + '\n')

  const results: (BenchmarkResult | null)[] = []

  try {
    // Test field selection
    const fieldSelectionResult = await testFieldSelection()
    if (fieldSelectionResult) results.push(fieldSelectionResult)

    // Test caching
    const cachingResults = await testCaching()
    results.push(...cachingResults)

    // Test batch operations
    const batchResult = await testBatchOperations()
    results.push(batchResult)

    // Summary
    console.log('📈 Performance Optimization Summary')
    console.log('=' .repeat(60))
    
    results.filter(Boolean).forEach((result, index) => {
      console.log(`${index + 1}. ${result!.operation}`)
      console.log(`   Before: ${result!.beforeMs.toFixed(2)}ms`)
      console.log(`   After: ${result!.afterMs.toFixed(2)}ms`)
      console.log(`   Result: ${result!.improvement}`)
      if (result!.cacheHits !== undefined) {
        console.log(`   Cache entries: ${result!.cacheHits}`)
      }
      console.log('')
    })

    const totalImprovement = results.filter(Boolean).reduce((acc, result) => {
      const improvement = parseFloat(result!.improvement.replace('% faster', ''))
      return acc + (improvement || 0)
    }, 0)

    console.log(`🎯 Average improvement: ${(totalImprovement / results.filter(Boolean).length).toFixed(1)}% faster`)

  } catch (error) {
    console.error('❌ Error during performance testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { benchmarkOperation, testFieldSelection, testCaching, testBatchOperations } 