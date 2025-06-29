# OpenRouter Migration Guide

This guide will help you complete the migration from direct OpenAI/Anthropic APIs to OpenRouter API.

## ✅ What's Been Done

### 1. New OpenRouter Integration
- ✅ Created `lib/openrouter-wrapper.ts` - Unified OpenRouter client
- ✅ Updated `lib/ai-wrapper.ts` - Simplified to use OpenRouter
- ✅ Updated `lib/models-config.ts` - Added OpenRouter model identifiers
- ✅ Updated `lib/subscription-utils.ts` - Added OpenRouter cost calculation
- ✅ Updated `lib/ai-errors.ts` - Added OpenRouter error types
- ✅ Created `.env.example` - Updated environment configuration

### 2. Architecture Improvements
- ✅ Eliminated dual provider complexity
- ✅ Added support for 400+ models through OpenRouter
- ✅ Unified error handling for all providers
- ✅ Better uptime through automatic fallbacks

## 🚀 Migration Steps

### Step 1: Get OpenRouter API Key
1. Sign up at [OpenRouter.ai](https://openrouter.ai)
2. Add credits to your account (5.5% fee on credit purchases)
3. Generate an API key from your dashboard

### Step 2: Update Environment Variables

**Remove these old variables:**
```env
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
OPENAI_API_DEFAULT_MODEL="..."
OPENAI_TEMPERATURE="..."
OPENAI_PRESENCE_PENALTY="..."
OPENAI_FREQUENCY_PENALTY="..."
```

**Add these new variables:**
```env
# Required
OPENROUTER_API_KEY="your_openrouter_api_key"

# Optional - Configuration
OPENROUTER_DEFAULT_MODEL="openai/gpt-4o-mini"
OPENROUTER_TEMPERATURE="0.7"
OPENROUTER_PRESENCE_PENALTY="0.1"
OPENROUTER_FREQUENCY_PENALTY="0.1"

# Optional - For OpenRouter rankings
SITE_URL="https://yourdomain.com"
SITE_NAME="Your App Name"
```

### Step 3: Update Your Existing Environment Files
Update all your environment files (`.env`, `.env.development`, `.env.production`) with the new OpenRouter configuration.

### Step 4: Remove Legacy Dependencies
The old Anthropic SDK dependency has been removed:
```bash
# Already done - npm uninstall @anthropic-ai/sdk
```

The OpenAI SDK is still needed as OpenRouter uses the OpenAI-compatible format.

### Step 5: Test the Migration
1. Start your development server: `npm run dev`
2. Test AI functionality in your app
3. Check the console for OpenRouter logs (🚀 emoji)

## 🎯 Benefits Gained

### 1. **More Models Available**
- **Before:** 5 models (OpenAI + Anthropic)
- **After:** 400+ models (OpenAI, Anthropic, Google, Meta, and more)

### 2. **Better Uptime**
- Automatic fallbacks between providers
- No more single points of failure

### 3. **Simplified Architecture**
- **Before:** Dual provider logic with separate error handling
- **After:** Single unified interface

### 4. **Cost Optimization**
- Same pricing as direct providers
- Better model selection for cost efficiency
- Dynamic pricing information

### 5. **New Model Types**
- **Google Gemini:** `google/gemini-pro`, `google/gemini-flash`
- **Meta Llama:** `meta-llama/llama-3.1-405b-instruct`, `meta-llama/llama-3.1-70b-instruct`
- **Perplexity:** `perplexity/llama-3.1-sonar-huge-128k-online` (web-connected)
- **And many more...**

## 🔄 Model ID Changes

Your existing saved models will need to be updated:

| Old Model ID | New OpenRouter Model ID |
|--------------|-------------------------|
| `gpt-4o` | `openai/gpt-4o` |
| `gpt-4o-mini` | `openai/gpt-4o-mini` |
| `claude-opus-4-20250514` | `anthropic/claude-3-opus` |
| `claude-sonnet-4-20250514` | `anthropic/claude-3.5-sonnet` |
| `claude-3-5-haiku-20241022` | `anthropic/claude-3-haiku` |

## 🧹 Cleanup Complete

### Files Removed
- ✅ `lib/openai-wrapper.ts` (functionality moved to openrouter-wrapper.ts)
- ✅ `@anthropic-ai/sdk` dependency uninstalled
- ✅ Legacy `calculateAICost` function removed

### Code Changes Made
All imports have been updated to use OpenRouter:

```typescript
// Updated automatically
import { createAICompletion } from './lib/ai-wrapper'
// Now uses OpenRouter internally
```

## 🔍 Monitoring

After migration, monitor:
1. **OpenRouter Dashboard:** Track usage and costs
2. **Application Logs:** Look for 🚀 OpenRouter request logs
3. **Error Handling:** Test with invalid models/keys to verify error handling

## ⚠️ Troubleshooting

### Common Issues

1. **Authentication Error**
   - Double-check your `OPENROUTER_API_KEY`
   - Ensure you have credits in your OpenRouter account

2. **Invalid Model Error**
   - Update model IDs to use OpenRouter format (e.g., `openai/gpt-4o-mini`)
   - Check available models at [OpenRouter Models](https://openrouter.ai/models)

3. **Insufficient Credits**
   - Add more credits to your OpenRouter account

### Getting Help
- Join [OpenRouter Discord](https://discord.gg/openrouter) for support
- Check [OpenRouter Documentation](https://openrouter.ai/docs)

## 🎉 Next Steps

After successful migration, consider:

1. **Explore New Models:** Try Google Gemini, Meta Llama, or other providers
2. **Optimize Costs:** Use different models for different use cases
3. **Enhanced Features:** Leverage OpenRouter's advanced routing and fallback features
4. **Real-time Pricing:** Consider implementing dynamic pricing from OpenRouter API

---

**Migration Complete!** 🚀 You now have access to 400+ AI models through a single, unified interface with better uptime and simplified architecture. 