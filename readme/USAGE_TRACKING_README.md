# Usage Tracking System

This document explains how the usage tracking system works for the LLM Context application, focusing on **token consumption monitoring**, **tier-based model access**, and **cost management**.

## Overview

The usage tracking system operates across **four primary dimensions**:
- **Model tier access control** (subscription-based)
- **Token consumption tracking** (usage-based)
- **Document generation limits** (count-based)
- **Storage usage tracking** (storage-based)

**Key Features:**
- ✅ **Model tiers** restrict access to expensive models by subscription level
- ✅ **Token limits calculated** based on most expensive model in each tier
- ✅ **Storage limits** prevent runaway storage costs
- ✅ **Server-side validation** ensures users only access models in their tier
- ✅ **Guaranteed profit margins** at all subscription levels

## Database Schema

### UserSubscription Table
```sql
model UserSubscription {
  plan            SubscriptionPlan   @default(basic)
  status          SubscriptionStatus @default(active)
  maxClients      Int @default(3)     // Basic: 3, Pro: unlimited (-1), Business: unlimited (-1)
  maxTokensPerMonth Int @default(100000) // Basic: 100K, Pro: 1.6M, Business: 4.5M
}
```

### UserUsage Table
```sql
model UserUsage {
  tokensUsed     Int @default(0)   // Total tokens consumed this month
  year           Int
  month          Int
}
```

### Storage Usage Tracking
- **Real-time calculation**: Storage usage calculated on-demand by measuring actual file sizes
- **Per-user tracking**: Total storage consumption across all documents
- **Per-client breakdown**: Storage usage segmented by client for analytics
- **Plan-based limits**: Storage limits enforced based on subscription plan

## Subscription Plans & Model Tiers

### Basic Plan ($10/month)
- **100K tokens per month** (~75 pages of content)
- **3 client profiles**
- **50 MB document storage**
- **Unlimited documents per month**
- **Basic tier models**: GPT-4o Mini, Claude Haiku, Gemini Flash
- **Cost structure**: Max AI cost $0.875 → **91% profit margin**

### Pro Plan ($17/month)
- **1.6M tokens per month** (~1,200 pages of content)  
- **Unlimited client profiles**
- **200 MB document storage**
- **Unlimited documents per month**
- **Pro tier models**: GPT-4o, Claude Sonnet, Gemini Pro + all basic models
- **Cost structure**: Max AI cost $14.40 → **15% profit margin**

### Business Plan ($43/month)
- **4.5M tokens per month** (~3,400 pages of content)
- **Unlimited client profiles**
- **2 GB document storage**
- **Unlimited documents per month**
- **Pro tier models**: GPT-4o, Claude Sonnet, Gemini Pro + all basic models
- **Cost structure**: Max AI cost $40.50 → **6% profit margin**

## Model Tier Cost Structure

### Basic Tier Models (Cost-Effective)
- **GPT-4o Mini**: $0.000375 per 1K tokens
- **Claude 3 Haiku**: $0.000875 per 1K tokens (most expensive basic)
- **Gemini Flash**: $0.0005 per 1K tokens

### Pro Tier Models (Premium)
- **GPT-4o**: $0.006125 per 1K tokens
- **Claude 3.5 Sonnet**: $0.009 per 1K tokens (most expensive pro)
- **Gemini Pro**: $0.001 per 1K tokens
- **Plus all basic tier models**

## Usage Tracking Flow

### 1. Pre-Request Validation
```typescript
// Check limits before API processing
const usageCheck = await checkUsageLimit(userId, 'document')
if (!usageCheck.allowed) {
  return usageLimitResponse(usageCheck)
}

// Check storage limits for document saving operations
await validateDocumentStorage(documentContent, userId)
```

### 2. Model Access Validation & Processing
```typescript
// Validate model access based on subscription tier
const modelAccess = await checkModelAccess(userId, selectedModel)
if (!modelAccess.allowed) {
  return modelAccessDeniedResponse(modelAccess)
}

// Process with OpenRouter and track tokens automatically
const result = await createOpenRouterCompletion({
  prompt,
  model: selectedModel,
  usageTracking: {
    userId,
    eventType: 'document_generation',
    resourceId: documentId
  }
})
```

### 3. Post-Processing Updates
```typescript
// Update monthly usage aggregates (tokens only)
await updateUsageTracking(userId, 'document_generation', {
  tokensUsed: result.usage.total_tokens
})
```

## Limit System Implementation

### Primary Limits Enforced
The system enforces **three primary limits** (whichever hits first blocks further usage):

1. **Token Limits** - Raw token consumption (fair across all models)
2. **Storage Limits** - Total document storage consumption  
3. **Client Limits** - Number of client profiles (Basic plan only)

### Model Access Control
```typescript
// Check if user can access specific model
export async function checkModelAccess(userId: string, modelId: string) {
  const subscription = await getUserSubscription(userId)
  const tier = getTierFromPlan(subscription.plan)
  const hasAccess = isModelAvailableForTier(modelId, tier)
  
  return {
    allowed: hasAccess,
    tier,
    plan: subscription.plan,
    modelId
  }
}
```

### Model Tier Configuration
```typescript
export const MODEL_TIERS = {
  [ModelTier.BASIC]: [
    'openai/gpt-4o-mini',        // $0.000375/1K tokens
    'anthropic/claude-3-haiku',   // $0.000875/1K tokens (most expensive)
    'google/gemini-flash',        // $0.0005/1K tokens
  ],
  [ModelTier.PRO]: [
    'openai/gpt-4o',             // $0.006125/1K tokens  
    'anthropic/claude-3.5-sonnet', // $0.009/1K tokens (most expensive)
    'google/gemini-pro',         // $0.001/1K tokens
    // Pro tier also includes all basic tier models
    ...MODEL_TIERS[ModelTier.BASIC]
  ],
}
```

## Analytics and Reporting

### Real-time Usage Info
```typescript
const usage = await getUsageInfo(userId)
// Returns current usage for: documents, clients, tokens, storage
// Plus subscription tier and model access information
```

### Monthly Analytics
```typescript
const analytics = await getUserUsageAnalytics(userId)  
// Returns: subscription info, limits, current usage, plan details, tier access
```

## Implementation Guidelines

### Adding New AI Services
1. Use `withAuthAndUsageCheck('document')` middleware
2. Implement with `createOpenRouterCompletion()` for automatic tracking
3. Focus on token consumption metrics

### Performance Considerations
- Usage checking uses efficient database queries
- Monthly aggregates prevent expensive historical calculations
- Token-only tracking reduces database complexity

### Security Considerations
- Token limits act as natural rate limiting
- Document limits prevent bulk generation abuse
- Usage tracking respects user privacy
- No content storage in usage tracking

## Storage Management

### Storage Limits by Plan
```typescript
export const STORAGE_LIMITS = {
  [SubscriptionPlan.BASIC]: 50 * 1024 * 1024,    // 50 MB
  [SubscriptionPlan.PRO]: 200 * 1024 * 1024,     // 200 MB  
  [SubscriptionPlan.BUSINESS]: 2 * 1024 * 1024 * 1024, // 2 GB
}
```

### Storage Cost Structure
- **Infrastructure cost**: ~$0.20/GB/month
- **Basic Plan**: 50 MB → ~$0.01/month storage cost
- **Pro Plan**: 200 MB → ~$0.04/month storage cost
- **Business Plan**: 2 GB → ~$0.40/month storage cost 