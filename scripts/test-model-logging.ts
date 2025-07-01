/**
 * Test script to verify centralized AI model logging
 * Run this script to test that model usage is properly logged for all AI interactions
 * 
 * Usage: npx tsx scripts/test-model-logging.ts
 */

import { config } from 'dotenv'
import { createOpenRouterCompletion } from '../lib/openrouter-wrapper'
import { MODEL_IDS } from '../lib/models-config'

// Load environment variables
config()

const TEST_USER_ID = 'test-logging-user'

async function testModelLogging() {
  console.log('🧪 Testing Centralized AI Model Logging...\n')

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables')
    process.exit(1)
  }

  // Test 1: Gemini 2.0 Flash logging
  console.log('1. Testing Gemini 2.0 Flash model logging...')
  try {
    await createOpenRouterCompletion(
      {
        model: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
        messages: [
          { role: 'user', content: 'Say "Gemini logging test successful!" if this is working.' }
        ],
        temperature: 0.7,
        max_tokens: 30
      },
      {
        userId: TEST_USER_ID,
        resourceId: 'test-gemini-logging',
        additionalMetadata: {
          testType: 'model-logging',
          modelFamily: 'gemini'
        }
      }
    )
    console.log('✅ Gemini 2.0 Flash logging test completed\n')
  } catch (error) {
    console.error('❌ Gemini 2.0 Flash test failed:', error)
  }

  // Test 2: GPT-4.1 Nano logging
  console.log('2. Testing GPT-4.1 Nano model logging...')
  try {
    await createOpenRouterCompletion(
      {
        model: MODEL_IDS.OPENAI_GPT_4_1_NANO,
        messages: [
          { role: 'user', content: 'Say "GPT-4.1 Nano logging test successful!" if this is working.' }
        ],
        temperature: 0.7,
        max_tokens: 30
      },
      {
        userId: TEST_USER_ID,
        resourceId: 'test-gpt-logging',
        additionalMetadata: {
          testType: 'model-logging',
          modelFamily: 'openai'
        }
      }
    )
    console.log('✅ GPT-4.1 Nano logging test completed\n')
  } catch (error) {
    console.error('❌ GPT-4.1 Nano test failed:', error)
  }

  // Test 3: Different service sources
  console.log('3. Testing different service source logging...')
  
  // Test chat assistant
  try {
    await createOpenRouterCompletion(
      {
        model: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
        messages: [
          { role: 'user', content: 'Chat assistant test' }
        ],
        max_tokens: 20
      },
      {
        userId: TEST_USER_ID,
        resourceId: 'chat-test-123',
        additionalMetadata: {
          testType: 'service-source-chat'
        }
      }
    )
    console.log('✅ Chat assistant service logging test completed')
  } catch (error) {
    console.error('❌ Chat assistant test failed:', error)
  }

  // Test meeting report generator
  try {
    await createOpenRouterCompletion(
      {
        model: MODEL_IDS.OPENAI_GPT_4_1_NANO,
        messages: [
          { role: 'user', content: 'Meeting report test' }
        ],
        max_tokens: 20
      },
      {
        userId: TEST_USER_ID,
        resourceId: 'meeting-report-test',
        additionalMetadata: {
          documentType: 'meeting-report',
          testType: 'service-source-meeting'
        }
      }
    )
    console.log('✅ Meeting report service logging test completed')
  } catch (error) {
    console.error('❌ Meeting report test failed:', error)
  }

  // Test custom document generator
  try {
    await createOpenRouterCompletion(
      {
        model: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
        messages: [
          { role: 'user', content: 'Custom document test' }
        ],
        max_tokens: 20
      },
      {
        userId: TEST_USER_ID,
        resourceId: 'custom-doc-test',
        additionalMetadata: {
          documentType: 'custom-document',
          testType: 'service-source-custom'
        }
      }
    )
    console.log('✅ Custom document service logging test completed\n')
  } catch (error) {
    console.error('❌ Custom document test failed:', error)
  }

  console.log('🎉 Model Logging Test Complete!')
  console.log('\n📊 What to look for in the logs:')
  console.log('   • AI Request logs with model icons (💎 for Gemini, ⚡ for GPT-4.1 Nano)')
  console.log('   • Service source identification (chat-assistant, meeting-report-generator, etc.)')
  console.log('   • Token usage information in completion logs')
  console.log('   • Proper context metadata including user, operation, and provider details')
  console.log('   • Colored and formatted output for easy reading')
}

// Helper to log environment info
function logEnvironmentInfo() {
  console.log('🔧 Environment Information:')
  console.log(`   • OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅ Present' : '❌ Missing'}`)
  console.log(`   • Available Models: ${Object.keys(MODEL_IDS).length}`)
  console.log(`   • Models: ${Object.values(MODEL_IDS).join(', ')}\n`)
}

if (require.main === module) {
  logEnvironmentInfo()
  testModelLogging().catch(error => {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  })
} 