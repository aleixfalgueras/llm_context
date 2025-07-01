# Usage Tracking System

This document explains how the usage tracking system works for the LLM Context application, focusing on **token consumption monitoring** using **Google Gemini Flash 1.5** for all AI functionalities.

**⚠️ UPDATED JANUARY 2025**: Simplified to use only Google Gemini Flash 1.5 for all AI functionalities

## Overview

The usage tracking system operates across **three primary dimensions**:
- **Token consumption tracking** (usage-based)
- **Document generation limits** (count-based)  
- **Storage usage tracking** (storage-based)

**Key Features:**
- ✅ **Single model architecture** - Google Gemini Flash 1.5 for all AI operations
- ✅ **Generous token limits** based on highly cost-effective model pricing
- ✅ **Excellent profit margins** at all subscription levels
- ✅ **Simplified user experience** with consistent AI performance

## Model Configuration

### Single Model Architecture
**All AI functionalities powered by:**
- **Google Gemini Flash 1.5**: $0.075/M input tokens, $0.30/M output tokens
- **Blended cost**: ~$0.131/M tokens (assuming 3:1 input/output ratio)
- **Context length**: 1M tokens
- **Performance**: Fast, efficient, and cost-effective

### Benefits of Single Model Approach
- **Consistent experience**: Same AI behavior across all features
- **Simplified maintenance**: No model selection complexity
- **Predictable costs**: Clear understanding of usage implications
- **Optimized performance**: Single model allows for better optimization

## Subscription Plans and Token Limits

### Basic Plan - $10/month
- **Token Limit**: 500,000 tokens/month (~375 pages of content)
- **Cost at limit**: ~$0.066 (99.3% profit margin)
- **Storage**: 50 MB
- **Clients**: 3 profiles
- **Perfect for**: Individual users and small businesses

### Pro Plan - $25/month  
- **Token Limit**: 10,000,000 tokens/month (~7,500 pages of content)
- **Cost at limit**: ~$1.31 (94.8% profit margin)
- **Storage**: 200 MB
- **Clients**: Unlimited
- **Perfect for**: Growing businesses and marketing professionals

### Business Plan - $50/month
- **Token Limit**: 25,000,000 tokens/month (~18,750 pages of content)
- **Cost at limit**: ~$3.28 (93.4% profit margin)
- **Storage**: 2 GB
- **Clients**: Unlimited
- **Perfect for**: Agencies and large teams

## Token Usage Examples

### Content Generation Examples
With Google Gemini Flash 1.5 token efficiency:

**Basic Plan (500K tokens/month):**
- ~375 full blog posts (1,330 tokens each)
- ~125 detailed marketing strategies (4,000 tokens each)
- ~50 comprehensive client reports (10,000 tokens each)

**Pro Plan (10M tokens/month):**
- ~7,500 full blog posts
- ~2,500 detailed marketing strategies  
- ~1,000 comprehensive client reports

**Business Plan (25M tokens/month):**
- ~18,750 full blog posts
- ~6,250 detailed marketing strategies
- ~2,500 comprehensive client reports

### Practical Usage Patterns

**Light User (Basic Plan):**
- 5-10 documents per week
- Regular client context updates
- Occasional AI-powered brainstorming

**Professional User (Pro Plan):**
- 20-50 documents per week
- Multiple client campaigns
- Regular content creation workflows

**Enterprise User (Business Plan):**
- 100+ documents per week
- Large-scale content operations
- Team collaboration and sharing

## Implementation Details

### Database Schema
```prisma
model UserSubscription {
  id                   String            @id @default(cuid())
  userId               String            @unique
  plan                 SubscriptionPlan  // BASIC, PRO, BUSINESS
  maxTokensPerMonth    Int               // Plan-based limits
  maxClients           Int               // Plan-based limits
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
}

model UserUsage {
  id                   String   @id @default(cuid())
  userId               String
  year                 Int
  month                Int
  tokensUsed           Int      @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### Token Limit Configuration
```typescript
export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.BASIC]: {
    maxTokensPerMonth: 500000,        // 500K tokens
    maxClients: 3,
    price: 10,
  },
  [SubscriptionPlan.PRO]: {
    maxTokensPerMonth: 10000000,      // 10M tokens
    maxClients: -1, // unlimited
    price: 25,
  },
  [SubscriptionPlan.BUSINESS]: {
    maxTokensPerMonth: 25000000,      // 25M tokens
    maxClients: -1, // unlimited
    price: 50,
  },
} as const;
```

### Model Configuration
```typescript
export const MODEL_IDS = {
  GOOGLE_GEMINI_1_5_FLASH: 'google/gemini-flash-1.5',
} as const;

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: MODEL_IDS.GOOGLE_GEMINI_1_5_FLASH,
    name: 'Gemini Flash 1.5',
    provider: 'google',
    pricing: { input: 0.000075, output: 0.0003 },
    contextLength: 1000000,
  }
];
```

## Usage Monitoring

### Real-Time Tracking
- **Token consumption** tracked per API call
- **Usage warnings** at 80% and 95% of limits
- **Hard limits** prevent overage
- **Monthly reset** for billing cycles

### Analytics Dashboard
- **Current usage** vs. plan limits
- **Usage trends** over time
- **Cost efficiency** metrics
- **Upgrade recommendations** when approaching limits

### Performance Optimization
- **Efficient prompting** strategies
- **Token usage** optimization
- **Batch processing** for multiple requests
- **Caching strategies** for repeated queries

## Cost Efficiency Benefits

### Simplified Pricing Model
- **No model selection complexity**: All features use the same highly efficient model
- **Predictable costs**: Clear token usage patterns
- **Generous limits**: Excellent value at all plan levels
- **High margins**: Sustainable business model

### Token Efficiency Tips
1. **Concise prompts**: Get better results with fewer tokens
2. **Batch operations**: Process multiple items together
3. **Reuse content**: Build on previous generations
4. **Smart templates**: Use efficient prompt structures

## Key Benefits

### For Users:
- **Consistent experience**: Same AI quality across all features
- **No confusion**: Single model, no selection paralysis
- **Generous limits**: Much higher token allowances than before
- **Fast performance**: Optimized for speed and efficiency

### For Business:
- **Simplified operations**: Easier to maintain and support
- **Predictable costs**: Clear cost structure with excellent margins
- **Better user experience**: No complexity around model choices
- **Scalable pricing**: Plans that grow with user needs

This simplified approach provides excellent value while maintaining strong profit margins and delivering a consistent, high-quality AI experience across all functionalities. 