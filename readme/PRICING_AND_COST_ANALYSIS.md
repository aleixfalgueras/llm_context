# Pricing and Cost Analysis

## Overview

**Cost Management Strategy:**
- ✅ **Model tiers** restrict access to expensive models by subscription level
- ✅ **Token limits calculated** based on most expensive model in each tier
- ✅ **Guaranteed profit margins** at all subscription levels
- ✅ **Curated model selection** focused on marketing use cases

## Model Tiers Structure

### Basic Tier Models (Cost-Effective)
**Available Models:**
- **GPT-4o Mini**: $0.000375 per 1K tokens (50/50 input/output split)
- **Claude 3 Haiku**: $0.000875 per 1K tokens (most expensive in tier)
- **Gemini Flash**: $0.0005 per 1K tokens

**Tier Strategy:**
- Focus on speed and efficiency
- Excellent for routine marketing tasks
- 120x cheaper than premium models
- Perfect for high-volume content generation

### Pro Tier Models (Premium Performance)
**Available Models:**
- **GPT-4o**: $0.006125 per 1K tokens
- **Claude 3.5 Sonnet**: $0.009 per 1K tokens (most expensive in tier)
- **Gemini Pro**: $0.001 per 1K tokens
- **Plus all Basic tier models**

**Tier Strategy:**
- Best reasoning and creativity
- Advanced content creation
- Complex marketing strategy development
- Premium writing quality

## Subscription Plans & Cost Analysis

### Basic Plan - $10/month
**Token Allocation**: 100,000 tokens (~75 pages of content)
**Storage Allocation**: 50 MB document storage

**Cost Breakdown:**
- User exclusively uses **Claude 3 Haiku** (most expensive basic model)
- Maximum monthly AI cost: 100,000 × $0.000875 = **$0.875**
- Storage infrastructure cost: ~$0.01/month (50 MB @ $0.20/GB)
- **Total Maximum Cost**: $0.875 + $0.01 = **$0.885**
- **Net Profit**: $10.00 - $0.885 = **$9.115**
- **Profit Margin**: **91.15%**

### Pro Plan - $20/month  
**Token Allocation**: 1,000,000 tokens (~750 pages of content)
**Storage Allocation**: 200 MB document storage

**Cost Breakdown:**
- User exclusively uses **Claude 3.5 Sonnet** (most expensive pro model)
- Maximum monthly AI cost: 1,000,000 × $0.009 = **$9.00**
- Storage infrastructure cost: ~$0.04/month (200 MB @ $0.20/GB)
- **Total Maximum Cost**: $9.00 + $0.04 = **$9.04**
- **Net Profit**: $20.00 - $9.04 = **$10.96**
- **Profit Margin**: **54.8%**

### Business Plan - $50/month
**Token Allocation**: 4,000,000 tokens (~3,000 pages of content)
**Storage Allocation**: 2 GB document storage

**Cost Breakdown:**
- User exclusively uses **Claude 3.5 Sonnet** (most expensive pro model)
- Maximum monthly AI cost: 4,000,000 × $0.009 = **$36.00**
- Storage infrastructure cost: ~$0.40/month (2 GB @ $0.20/GB)
- **Total Maximum Cost**: $36.00 + $0.40 = **$36.40**
- **Net Profit**: $50.00 - $36.40 = **$13.60**
- **Profit Margin**: **27.2%**

## Technical Implementation

### Server-Side Model Access Control
```typescript
// Validate model access based on subscription tier
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

### Token Limit Calculation Logic
```typescript
// Calculate safe token limits based on worst-case model usage
export function calculateTokenLimits() {
  // Basic Plan: $10 revenue, 91% margin target
  const basicMaxCost = 10 * 0.09 // $0.90 max cost
  const basicWorstCaseRate = 0.000875 // Claude 3 Haiku rate
  const basicTokens = Math.floor(basicMaxCost / basicWorstCaseRate * 1000)
  
  // Pro Plan: $20 revenue, 55% margin target  
  const proMaxCost = 20 * 0.45 // $9.00 max cost
  const proWorstCaseRate = 0.009 // Claude 3.5 Sonnet rate
  const proTokens = Math.floor(proMaxCost / proWorstCaseRate * 1000)
  
  // Business Plan: $50 revenue, 27% margin target
  const businessMaxCost = 50 * 0.73 // $36.50 max cost
  const businessWorstCaseRate = 0.009 // Claude 3.5 Sonnet rate
  const businessTokens = Math.floor(businessMaxCost / businessWorstCaseRate * 1000)
  
  return { basicTokens, proTokens, businessTokens }
}
```

## Storage Cost Structure

### Storage Infrastructure Costs
- **Base cost**: ~$0.20/GB/month for cloud storage
- **Additional overhead**: Backup, redundancy, bandwidth costs

### Storage Limits by Plan
```typescript
export const STORAGE_LIMITS = {
  [SubscriptionPlan.BASIC]: 50 * 1024 * 1024,    // 50 MB
  [SubscriptionPlan.PRO]: 200 * 1024 * 1024,     // 200 MB
  [SubscriptionPlan.BUSINESS]: 2 * 1024 * 1024 * 1024, // 2 GB
}
```

### Per-Plan Storage Costs
- **Basic Plan**: 50 MB → ~$0.01/month storage cost
- **Pro Plan**: 200 MB → ~$0.04/month storage cost  
- **Business Plan**: 2 GB → ~$0.40/month storage cost

## Cost Control Features

### Risk Mitigation
- **No runaway costs**: Token limits prevent unlimited spending
- **Tier restrictions**: Expensive models limited to higher-paying subscribers
- **Positive margins**: Even worst-case scenarios remain profitable
- **Storage limits**: Prevent storage cost escalation

### Usage Monitoring
- **Real-time tracking**: Monitor token consumption as it happens
- **Monthly aggregates**: Track usage patterns over time
- **Alert thresholds**: Warn users approaching limits
- **Cost attribution**: Track costs per model and service

## Implementation Benefits

### Cost Predictability
- **Fixed monthly revenue**: Subscription model provides guaranteed income
- **Capped monthly costs**: Token limits prevent cost overruns
- **Transparent pricing**: Users know exactly what they pay
- **Scalable margins**: More users = more profit

### Technical Advantages
- **Simple billing**: No complex cost calculations
- **Easy maintenance**: OpenRouter handles pricing updates
- **Performance optimized**: Efficient database operations
- **Secure access**: Server-side model validation 