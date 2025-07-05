/**
 * OpenRouter Integration Test Script
 * Run this script to verify your OpenRouter setup is working correctly
 * 
 * Usage: npx tsx scripts/test-openrouter.ts
 */

import { config } from 'dotenv'
import { openRouterService } from '../lib/openrouter'
import { DEFAULT_MODEL } from '../lib/models-config'

// Load environment variables
config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

async function testOpenRouterIntegration() {
  console.log('🚀 Testing OpenRouter Integration...\n')

  // Test 1: Check API Key
  console.log('1. Checking API Key...')
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables')
    process.exit(1)
  }
  console.log('✅ API Key found')

  // Test 2: Check Credits
  console.log('\n2. Checking Account Credits...')
  try {
    const creditsData = await openRouterService.getCredits()
    const credits = {
      credits: creditsData.data?.limit || 0
    }
    if (credits) {
      console.log(`✅ Account Credits: $${credits.credits.toFixed(2)}`)
    } else {
      console.log('⚠️  Could not fetch credit information')
    }
  } catch (error) {
    console.error('❌ Error fetching credits:', error)
  }

  // Test 3: Fetch Available Models
  console.log('\n3. Fetching Available Models...')
  try {
    const modelsResponse = await openRouterService.getModels()
    const models = modelsResponse.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: model.description || 'No description available',
      context_length: model.context_length || 4096,
      pricing: model.pricing || { prompt: '0', completion: '0' },
      top_provider: model.top_provider || {}
    }))
    console.log(`✅ Found ${models.length} available models`)
    
    // Show some popular models
    const popularModels = models
      .filter(m => m.id.includes('gpt-4o') || m.id.includes('claude') || m.id.includes('gemini'))
      .slice(0, 5)
    
    if (popularModels.length > 0) {
      console.log('\n   Popular models available:')
      popularModels.forEach(model => {
        console.log(`   - ${model.id}: ${model.name}`)
      })
    }
  } catch (error) {
    console.error('❌ Error fetching models:', error)
  }

  // Test 4: Simple Completion Test
  console.log('\n4. Testing AI Completion...')
  try {
    const testCompletion = await openRouterService.createCompletion(
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'user', content: 'Say "Hello from OpenRouter!" if this test is working.' }
        ],
        temperature: 0.7,
        max_tokens: 50
      },
      {
        userId: 'test-user',
        resourceId: 'test-completion'
      }
    )

    console.log('✅ AI Completion successful!')
    console.log(`   Response: ${testCompletion.content}`)
    if (testCompletion.usage) {
      console.log(`   Tokens: ${testCompletion.usage.totalTokens}`)
    }
    console.log(`   Note: OpenRouter handles billing automatically`)
  } catch (error) {
    console.error('❌ Error in AI completion test:', error)
  }

  // Test 5: Test Error Handling
  console.log('\n5. Testing Error Handling...')
  try {
    await openRouterService.createCompletion(
      {
        model: 'invalid/model-name',
        messages: [
          { role: 'user', content: 'This should fail' }
        ]
      },
      {
        userId: 'test-user',
        resourceId: 'test-error'
      }
    )
    console.log('⚠️  Expected error did not occur')
  } catch (error: any) {
    if (error.name === 'AIProviderError') {
      console.log('✅ Error handling working correctly')
      console.log(`   Error type: ${error.type}`)
      console.log(`   Provider: ${error.provider}`)
    } else {
      console.log('⚠️  Unexpected error type:', error.message)
    }
  }

  console.log('\n🎉 OpenRouter Integration Test Complete!')
  console.log('\n📝 Next Steps:')
  console.log('   1. Update your environment variables in all deployment environments')
  console.log('   2. Test your actual application functionality')
  console.log('   3. Monitor usage in your OpenRouter dashboard')
  console.log('   4. Consider exploring new models available through OpenRouter')
}

// Helper function to show environment setup
function showEnvSetup() {
  console.log('📋 Required Environment Variables:')
  console.log('   OPENROUTER_API_KEY="your_api_key_here"')
  console.log('   OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini" (optional)')
  console.log('   SITE_URL="https://yourdomain.com" (optional)')
  console.log('   SITE_NAME="Your App Name" (optional)')
  console.log('')
}

// Main execution
if (require.main === module) {
  if (!OPENROUTER_API_KEY) {
    console.log('❌ OpenRouter API Key Missing\n')
    showEnvSetup()
    console.log('Please add your OpenRouter API key to your environment variables and try again.')
    process.exit(1)
  }

  testOpenRouterIntegration().catch(error => {
    console.error('Test failed with error:', error)
    process.exit(1)
  })
} 