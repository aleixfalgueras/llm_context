# OpenRouter Integration Guide

This guide explains how the LLM Context application integrates with OpenRouter to provide access to Google Gemini 2.0 Flash and OpenAI GPT-4.1 Nano models.

## 🎯 Overview

### **What is OpenRouter**
OpenRouter is a unified API that provides access to multiple AI providers including Google, OpenAI, Anthropic, and others. Instead of managing separate API keys and integrations for each provider, OpenRouter offers a single interface.

### **Why OpenRouter**
- **Unified API**: Single integration point for multiple AI providers
- **Cost Management**: Transparent pricing and usage tracking
- **Reliability**: Built-in failover and load balancing
- **Model Diversity**: Access to 400+ models from different providers
- **Business Sustainability**: Predictable costs and excellent profit margins

## 🏗️ Architecture

### **Modular Structure**
The OpenRouter integration is built with a clean modular architecture:

```
lib/openrouter/
├── client.ts          # Low-level OpenRouter API client
├── service.ts         # High-level AI service with usage tracking
├── error-handler.ts   # AI-specific error handling
├── stream-handler.ts  # Real-time streaming response processing
└── index.ts          # Unified exports
```

### **Integration Points**
1. **Chat Interface** (`/app/api/chat/route.ts`) - Real-time conversations
2. **AI Services** (`/app/api/ai-services/`) - Document generation
3. **Usage Tracking** (`lib/usage-middleware.ts`) - Token consumption monitoring

## 🤖 Available Models

### **Google Gemini 2.0 Flash**
- **Model ID**: `google/gemini-2.0-flash-001`
- **Pricing**: $0.10/M input tokens, $0.40/M output tokens
- **Context Length**: 1,000,000 tokens
- **Features**: Enhanced reasoning, multimodal capabilities, latest Google AI

### **OpenAI GPT-4.1 Nano**
- **Model ID**: `openai/gpt-4.1-nano-2025-04-14`
- **Pricing**: $0.10/M input tokens, $0.40/M output tokens
- **Context Length**: 200,000 tokens
- **Features**: Efficient performance, excellent reasoning, cost-effective

### **Model Selection**
- **All Tiers**: Both models available across Basic, Pro, and Business plans
- **User Choice**: Users can select preferred model per conversation/service
- **Persistent Preferences**: Model choices saved in localStorage
- **Cost Consistency**: Identical pricing eliminates cost confusion

## 🔧 Configuration

### **Environment Variables**
```env
# Required
OPENROUTER_API_KEY="your_openrouter_api_key"

# Optional - Model Configuration
OPENROUTER_DEFAULT_MODEL="google/gemini-2.0-flash-001"
OPENROUTER_TEMPERATURE="0.7"
OPENROUTER_PRESENCE_PENALTY="0.1"
OPENROUTER_FREQUENCY_PENALTY="0.1"

# Optional - Site Information for OpenRouter Rankings
SITE_URL="https://yourdomain.com"
SITE_NAME="Your App Name"
```

### **Model Configuration** (`lib/models-config.ts`)
```typescript
export const MODEL_IDS = {
  GOOGLE_GEMINI_2_0_FLASH: 'google/gemini-2.0-flash-001',
  OPENAI_GPT_4_1_NANO: 'openai/gpt-4.1-nano-2025-04-14',
} as const

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: MODEL_IDS.GOOGLE_GEMINI_2_0_FLASH,
    name: 'Gemini 2.0 Flash',
    description: 'Latest Google model with enhanced performance',
    provider: 'google',
    contextLength: 1000000,
    pricing: { input: 0.0001, output: 0.0004 },
    tier: ModelTier.BASIC
  },
  {
    id: MODEL_IDS.OPENAI_GPT_4_1_NANO,
    name: 'GPT-4.1 Nano',
    description: 'Efficient OpenAI model',
    provider: 'openai',
    contextLength: 200000,
    pricing: { input: 0.0001, output: 0.0004 },
    tier: ModelTier.BASIC
  }
]
```

## 📡 API Integration

### **OpenRouter Client** (`lib/openrouter/client.ts`)
Low-level client for direct OpenRouter API communication:
```typescript
export async function createChatCompletion(options: ChatCompletionOptions) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL,
      'X-Title': process.env.SITE_NAME,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream,
    })
  })
  
  return response
}
```

### **AI Service** (`lib/openrouter/service.ts`)
High-level service with usage tracking and orchestration:
```typescript
export async function generateAIResponse(options: AIGenerationOptions) {
  const startTime = Date.now()
  
  try {
    // Usage validation
    await validateUsageLimits(options.userId)
    
    // Generate response
    const response = await createChatCompletion({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature || DEFAULT_TEMPERATURE,
      maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
      stream: options.stream || false
    })
    
    // Track usage
    await trackTokenUsage(options.userId, response.usage)
    
    return response
  } catch (error) {
    await handleAIError(error, options)
    throw error
  }
}
```

## 🔄 Streaming Support

### **Stream Handler** (`lib/openrouter/stream-handler.ts`)
Real-time response processing for both models:
```typescript
export async function processStreamResponse(response: Response) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        
        try {
          const parsed = JSON.parse(data)
          yield parsed.choices[0]?.delta?.content || ''
        } catch (error) {
          console.error('Failed to parse streaming data:', error)
        }
      }
    }
  }
}
```

## 📊 Usage Tracking

### **Token Monitoring**
- **Real-time Tracking**: Monitor consumption across both models
- **Usage Validation**: Prevent overages before API calls
- **Cost Calculation**: Accurate cost tracking per model
- **Subscription Limits**: Enforce tier-based token limits

### **Subscription Integration**
```typescript
export const SUBSCRIPTION_LIMITS = {
  [SubscriptionPlan.BASIC]: {
    maxTokensPerMonth: 5000000,    // 5M tokens
    cost: 0.875,                   // $0.875 at limit
    profitMargin: 0.9125           // 91.25%
  },
  [SubscriptionPlan.PRO]: {
    maxTokensPerMonth: 15000000,   // 15M tokens
    cost: 2.625,                   // $2.625 at limit
    profitMargin: 0.895            // 89.5%
  },
  [SubscriptionPlan.BUSINESS]: {
    maxTokensPerMonth: 40000000,   // 40M tokens
    cost: 7.00,                    // $7.00 at limit
    profitMargin: 0.86             // 86%
  }
}
```

## 🛡️ Error Handling

### **AI-Specific Errors** (`lib/openrouter/error-handler.ts`)
Comprehensive error management with fallback capabilities:
```typescript
export async function handleAIError(error: any, context: ErrorContext) {
  if (error.status === 429) {
    // Rate limiting - implement retry with backoff
    await retryWithBackoff(context)
  } else if (error.status === 401) {
    // Authentication error
    throw new AIError('Invalid API key or insufficient credits')
  } else if (error.status === 400) {
    // Bad request - invalid model or parameters
    throw new AIError('Invalid request parameters')
  } else {
    // General error handling
    logger.error('OpenRouter API error', error, context)
    throw new AIError('AI service temporarily unavailable')
  }
}
```

## 🧪 Testing

### **Model Testing**
Test both models to verify integration:
```bash
# Test Google Gemini 2.0 Flash
npx tsx scripts/test-openrouter.ts google/gemini-2.0-flash-001

# Test OpenAI GPT-4.1 Nano
npx tsx scripts/test-openrouter.ts openai/gpt-4.1-nano-2025-04-14
```

### **Integration Testing**
Verify complete workflow:
1. **Authentication**: Ensure API key is valid
2. **Model Access**: Test both models respond correctly
3. **Streaming**: Verify real-time response processing
4. **Usage Tracking**: Confirm token consumption is tracked
5. **Error Handling**: Test error scenarios and recovery

## 💰 Cost Management

### **Profit Margins**
- **Basic Plan**: 91.25% margin ($10 - $0.875 = $9.125)
- **Pro Plan**: 89.5% margin ($25 - $2.625 = $22.375)
- **Business Plan**: 86% margin ($50 - $7.00 = $43.00)

### **Cost Optimization**
- **Efficient Prompting**: Optimize prompt length and structure
- **Model Selection**: Choose appropriate model for each task
- **Token Limits**: Reasonable max_tokens to prevent excessive usage
- **Caching**: Implement response caching where applicable

## 🚀 Best Practices

### **Performance**
1. **Connection Pooling**: Reuse HTTP connections
2. **Timeout Configuration**: Set appropriate request timeouts
3. **Retry Logic**: Implement exponential backoff for transient errors
4. **Monitoring**: Track response times and error rates

### **Security**
1. **API Key Protection**: Never expose keys in client-side code
2. **Input Validation**: Sanitize all inputs before API calls
3. **Rate Limiting**: Implement application-level rate limiting
4. **Audit Logging**: Log all API interactions for compliance

### **Cost Control**
1. **Usage Monitoring**: Real-time tracking of token consumption
2. **Alert Systems**: Notify when approaching limits
3. **Batch Processing**: Group requests when possible
4. **Model Selection**: Use appropriate model for each use case

## 🔄 Migration Notes

### **From OpenAI Direct Integration**
The application was migrated from direct OpenAI integration to OpenRouter:

1. **API Endpoint**: Changed from OpenAI API to OpenRouter API
2. **Model IDs**: Updated to OpenRouter format (e.g., `openai/gpt-4.1-nano-2025-04-14`)
3. **Headers**: Added OpenRouter-specific headers for site attribution
4. **Error Handling**: Enhanced to handle OpenRouter-specific responses
5. **Usage Tracking**: Updated to work with OpenRouter usage reporting

### **Benefits of Migration**
- **Model Diversity**: Access to both Google and OpenAI models
- **Cost Transparency**: Clear pricing across all models
- **Reliability**: Built-in failover and load balancing
- **Future-Proof**: Easy to add new models as they become available

---

**The OpenRouter integration provides a robust, cost-effective foundation for AI functionality while maintaining excellent profit margins and user experience across both premium models.**