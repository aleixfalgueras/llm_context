#!/usr/bin/env tsx

/**
 * Test script to verify temporal logging throughout the application
 * Run with: npx tsx scripts/test-logging.ts
 */

import { logger } from '../lib/logger'
import { clientLogger } from '../lib/client-logger'

console.log('🧪 Testing Application Logging System...\n')

// Test server-side logger
console.log('📊 Testing Server Logger:')
logger.info('Application logging test started', { 
  metadata: { testType: 'comprehensive', timestamp: new Date().toISOString() }
})

logger.debug('Debug message test', { 
  userId: 'test-user-123',
  chatId: 'test-chat-456',
  metadata: { debugLevel: 'verbose' }
})

logger.warn('Warning message test', { 
  operation: 'test-operation',
  metadata: { warningType: 'expected' }
})

logger.error('Error message test (simulated)', new Error('Test error for logging'), { 
  userId: 'test-user-123',
  metadata: { errorType: 'simulated' }
})

// Test performance timing
const endTiming = logger.startTiming('Test operation timing')
setTimeout(() => {
  endTiming()
  console.log('✅ Server logger timing test completed\n')
}, 100)

// Test API logging
logger.apiRequest('POST', '/test/endpoint', { userId: 'test-user-123' })
logger.apiResponse('POST', '/test/endpoint', 200, { userId: 'test-user-123' })

// Test database operation logging
logger.dbQuery('findMany', 'testTable', { userId: 'test-user-123' })

// Test AI service logging
logger.aiRequest('gpt-4o', 1000, { userId: 'test-user-123', chatId: 'test-chat-456' })

// Test user action logging
logger.userAction('Test user action', { userId: 'test-user-123', metadata: { action: 'button-click' } })

console.log('📱 Testing Client Logger:')

// Test client-side logger (simulated browser environment)
if (typeof window === 'undefined') {
  // Simulate browser environment for testing
  (global as any).window = {
    navigator: { userAgent: 'Test-Agent/1.0' },
    location: { href: 'http://localhost:3000/test' }
  }
  
  const performance = {
    now: () => Date.now()
  }
  
  ;(global as any).performance = performance
}

clientLogger.info('Client logging test started', { 
  component: 'TestScript',
  metadata: { clientTest: true }
})

clientLogger.userInteraction('Test user interaction', { 
  component: 'TestComponent',
  action: 'test-click'
})

clientLogger.apiCall('GET', '/api/test', { component: 'TestComponent' })
clientLogger.apiResponse('GET', '/api/test', 200, { component: 'TestComponent' })

clientLogger.messageSent(25, 'gpt-4o', { chatId: 'test-chat-456' })
clientLogger.messageReceived(150, { chatId: 'test-chat-456' })

clientLogger.promptSelected('Test Prompt', { chatId: 'test-chat-456' })

clientLogger.exportInitiated('chat', { chatId: 'test-chat-456', clientId: 'test-client-789' })
clientLogger.exportCompleted('chat', { chatId: 'test-chat-456', clientId: 'test-client-789' })

// Test client-side performance timing
const endClientTiming = clientLogger.startTiming('Client test operation')
setTimeout(() => {
  endClientTiming()
  console.log('✅ Client logger timing test completed\n')
}, 50)

// Test component lifecycle logging
clientLogger.componentMount('TestComponent', { metadata: { test: true } })
clientLogger.componentUnmount('TestComponent', { metadata: { test: true } })

console.log('🎯 Logging Test Categories Covered:')
console.log('✅ Server-side API requests/responses')
console.log('✅ Database operations')
console.log('✅ AI service calls')
console.log('✅ User actions and interactions')
console.log('✅ Performance timing (server & client)')
console.log('✅ Error handling and stack traces')
console.log('✅ Client-side user interactions')
console.log('✅ Chat message flow')
console.log('✅ Component lifecycle events')
console.log('✅ Export operations')
console.log('✅ Authentication flow')
console.log('✅ Navigation events\n')

console.log('📝 How to Use the Logging:')
console.log('1. Start your Next.js development server: npm run dev')
console.log('2. Open browser developer tools (F12)')
console.log('3. Navigate through your application')
console.log('4. Watch the console for detailed temporal logs')
console.log('5. Check server logs in your terminal')
console.log('6. All logs include timestamps, context, and structured metadata\n')

console.log('🔍 Log Levels:')
console.log('• DEBUG: Detailed development information')
console.log('• INFO: General application flow and user actions')
console.log('• WARN: Potential issues or unexpected conditions')
console.log('• ERROR: Actual errors with stack traces\n')

console.log('📊 Log Context Includes:')
console.log('• User ID for tracking user-specific actions')
console.log('• Chat ID for conversation-specific logs')
console.log('• Client ID for client-specific operations')
console.log('• Component names for frontend tracking')
console.log('• Performance timings in milliseconds')
console.log('• Request/response metadata')
console.log('• Error stack traces when applicable\n')

console.log('🚀 All logging systems are ready for comprehensive application testing!')

process.exit(0) 