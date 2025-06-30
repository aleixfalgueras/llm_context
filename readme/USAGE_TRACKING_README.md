# Usage Tracking System

This document explains how the usage tracking system works for the LLM Context application, focusing on **token consumption monitoring**, **tier-based model access**, and **cost management**.

**⚠️ UPDATED JANUARY 2025**: Simplified model selection - one model per provider per tier for clarity

## Overview

The usage tracking system operates across **four primary dimensions**:
- **Model tier access control** (subscription-based)
- **Token consumption tracking** (usage-based)
- **Document generation limits** (count-based)
- **Storage usage tracking** (storage-based)

**Key Features:**
- ✅ **Simplified model tiers** - one model per provider per tier
- ✅ **Token limits calculated** based on most expensive model in each tier
- ✅ **Guaranteed profit margins** at all subscription levels
- ✅ **Clear model selection** with excellent options across all price points

## Model Access Tiers

### Basic Tier Models ($9/month)
**Available Models (3 total - one per provider):**
- **OpenAI GPT-4.1 Nano**: $0.0003 per 1K tokens ← **Best OpenAI value!**
- **Anthropic Claude 3 Haiku**: $0.00058 per 1K tokens (most expensive)
- **Google Gemini 1.5 Flash**: $0.000158 per 1K tokens ← **Extremely cost-effective!**

**Token Limit**: 15,517 tokens/month (based on Claude 3 Haiku)

### Pro/Business Tier Models ($29/$79/month)
**Available Models (6 total - includes all Basic tier + 3 premium):**

**Basic Tier Models:**
- **OpenAI GPT-4.1 Nano**: $0.0003 per 1K tokens
- **Anthropic Claude 3 Haiku**: $0.00058 per 1K tokens
- **Google Gemini 1.5 Flash**: $0.000158 per 1K tokens

**Premium Models:**
- **OpenAI GPT-4.1**: $0.006 per 1K tokens ← **Flagship performance!**
- **Anthropic Claude 3.5 Sonnet**: $0.011 per 1K tokens (most expensive)
- **Google Gemini 2.0 Flash**: $0.0003 per 1K tokens ← **Outstanding value!**

**Pro Token Limit**: 2,636 tokens/month (based on Claude 3.5 Sonnet)
**Business Token Limit**: 7,182 tokens/month (based on Claude 3.5 Sonnet)

**Smart Choice Advantages for Pro Users**: 
- **Gemini 2.0 Flash**: 96,667 tokens (37x more!)
- **GPT-4.1**: 4,833 tokens (2x more!)
- **Basic tier models**: Up to 183,544 tokens (70x more with Gemini 1.5 Flash!)

## Token Usage Optimization

### Model Selection Impact on Usage

**Pro Plan ($29/month) - Token Comparison:**
```
Claude 3.5 Sonnet:    2,636 tokens/month (most expensive)
GPT-4.1:              4,833 tokens/month ← 2x more usage!
Gemini 2.0 Flash:    96,667 tokens/month ← 37x more usage!
GPT-4.1 Nano:        96,667 tokens/month ← 37x more usage!
Claude 3 Haiku:      50,000 tokens/month ← 19x more usage!
Gemini 1.5 Flash:   183,544 tokens/month ← 70x more usage!
```

**Business Plan ($79/month) - Token Comparison:**
```
Claude 3.5 Sonnet:     7,182 tokens/month (most expensive)
GPT-4.1:              13,167 tokens/month ← 2x more usage!
Gemini 2.0 Flash:    263,333 tokens/month ← 37x more usage!
GPT-4.1 Nano:        263,333 tokens/month ← 37x more usage!
Claude 3 Haiku:      136,207 tokens/month ← 19x more usage!
Gemini 1.5 Flash:   500,000 tokens/month ← 70x more usage!
```

### Strategic Usage Patterns

**Cost-Conscious Users:**
- Use Gemini 1.5 Flash for routine tasks (70x more tokens!)
- Use GPT-4.1 Nano for quality + efficiency
- Reserve premium models for critical work

**Quality-First Users:**
- Use Claude 3.5 Sonnet for creative work
- Use GPT-4.1 for coding and analysis
- Hit token limits with premium models

**Mixed Strategy (Recommended):**
- Gemini 1.5 Flash for drafting and ideation
- GPT-4.1 for balanced performance
- Claude 3.5 Sonnet for final polish

## Implementation Details

### Database Schema
```prisma
model Subscription {
  id                   String            @id @default(cuid())
  userId               String            @unique
  plan                 SubscriptionPlan  // BASIC, PRO, BUSINESS
  tokensUsed           Int               @default(0)
  maxTokens            Int               // Tier-based limits
  documentsGenerated   Int               @default(0)
  maxDocuments         Int               // Tier-based limits
  storageUsed          BigInt            @default(0)
  maxStorage           BigInt            // Tier-based limits
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
}
```

### Token Limit Configuration
```typescript
export const SUBSCRIPTION_LIMITS = {
  [SubscriptionPlan.BASIC]: {
    maxTokens: 15517,        // Based on Claude 3 Haiku cost
    maxDocuments: 20,
    maxStorage: 52428800,    // 50 MB
  },
  [SubscriptionPlan.PRO]: {
    maxTokens: 2636,         // Based on Claude 3.5 Sonnet cost
    maxDocuments: 100,
    maxStorage: 209715200,   // 200 MB
  },
  [SubscriptionPlan.BUSINESS]: {
    maxTokens: 7182,         // Based on Claude 3.5 Sonnet cost
    maxDocuments: 500,
    maxStorage: 2147483648,  // 2 GB
  },
} as const;
```

### Model Access Control
```typescript
export const MODEL_TIER_ACCESS = {
  [ModelTier.BASIC]: [
    'openai/gpt-4.1-nano',
    'anthropic/claude-3-haiku',
    'google/gemini-1.5-flash'
  ],
  [ModelTier.PRO]: [
    // Pro tier models (same for Business)
    'openai/gpt-4.1',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash',
    // Also includes Basic tier models
    'openai/gpt-4.1-nano',
    'anthropic/claude-3-haiku',
    'google/gemini-1.5-flash'
  ],
  [ModelTier.BUSINESS]: [
    // Same as Pro tier
    'openai/gpt-4.1',
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.0-flash',
    'openai/gpt-4.1-nano',
    'anthropic/claude-3-haiku',
    'google/gemini-1.5-flash'
  ],
} as const;
```

## Usage Monitoring

### Real-Time Tracking
- **Token consumption** tracked per API call
- **Model costs** calculated dynamically
- **Usage warnings** at 80% and 95% of limits
- **Hard limits** prevent overage

### Analytics Dashboard
- **Usage patterns** by model type
- **Cost efficiency** metrics
- **Trend analysis** over time
- **Optimization recommendations**

### Performance Optimization
- **Batch processing** for multiple requests
- **Caching strategies** for repeated queries
- **Model routing** based on cost/performance
- **Fallback systems** for high availability

## Revenue Protection

### Break-Even Strategy
Each subscription tier is priced to break even when users exclusively use the most expensive model in that tier:

- **Basic**: Breaks even with Claude 3 Haiku usage
- **Pro**: Breaks even with Claude 3.5 Sonnet usage  
- **Business**: Higher margin with Claude 3.5 Sonnet usage

### Profit Generation
Profits come from users choosing more efficient models:
- **Gemini usage** generates extremely high margins (70x efficiency!)
- **Mixed usage patterns** create natural profitability
- **Simplified choice** reduces decision fatigue

## Key Benefits of Simplified Model Selection

### For Users:
- **Clear choices**: One proven model per provider per tier
- **No decision paralysis**: Best options pre-selected
- **Predictable costs**: Easy to understand pricing
- **Performance guaranteed**: All models vetted for quality

### For Business:
- **Simplified support**: Fewer models to maintain
- **Clear profit margins**: Predictable cost structure
- **Better user experience**: Less complexity
- **Focus on value**: Best models at each price point 