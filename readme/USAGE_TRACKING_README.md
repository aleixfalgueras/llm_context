# Multi-AI Usage Tracking System

This document explains how the usage tracking system works for the LLM Context application, focusing on monitoring and limiting AI service usage across multiple providers (OpenAI and Anthropic) to manage costs and ensure fair resource allocation.

## Overview

The usage tracking system operates across multiple dimensions:
- **Document generation limits** (count-based)
- **Token consumption tracking** (usage-based)
- **Cost management** (cost-based)
- **Client profile limits** (count-based)

**Simplified Approach**: The system has been streamlined to focus on essential metrics that directly correlate with costs and value delivery. Conversation limits and prompt limits have been removed to improve user experience.

## Database Schema

### UserSubscription Table
Stores subscription plan details and limits:

```sql
model UserSubscription {
  -- Plan Limits
  maxClients              Int     -- Basic: 3, Pro: unlimited (-1), Business: unlimited (-1)
  maxDocumentsPerMonth    Int     -- Basic: 20, Pro: 200, Business: unlimited (-1)
  maxTokensPerMonth       Int     -- Basic: 100K, Pro: 2M, Business: unlimited (-1)
  maxCostPerMonth         Float   -- Basic: $2, Pro: $12, Business: $35 (all across AI providers)
  
  -- Plan Features
  
}
```

### UserUsage Table
Tracks monthly usage aggregates:

```sql
model UserUsage {
  documentsGenerated Int     -- Total documents generated this month
  tokensUsed        Int     -- Total tokens consumed this month  
  estimatedCost     Float   -- Estimated AI costs this month (across all providers)
}
```

## Service-Specific Usage Tracking

### Document Generation Services
All AI services that generate content track:

1. **Meeting Report Generator**
   - Document count increment
   - Token usage (prompt + completion)
   - Estimated AI cost (OpenAI or Anthropic)
   - Model and provider used (for analytics)

2. **Custom Document Generator**
   - Document count increment  
   - Token usage (prompt + completion)
   - Estimated AI cost (OpenAI or Anthropic)
   - Template and provider used (for analytics)

3. **Chat/Assistant Service**
   - Treated as document generation
   - Token usage tracking across providers
   - Cost monitoring per conversation across all AI providers

### Client Management
- **Limit Type**: Real-time count of existing client profiles
- **No Usage Tracking**: Users can delete/recreate clients up to their limit
- **Enforcement**: Checked before client creation

### Prompt Management
- **No Limits**: Users can create unlimited custom prompts (removed restriction)
- **No Usage Tracking**: Prompts are treated as templates, not AI services
- **Storage Only**: Prompts stored in database without restrictions
- **Usage Analytics**: Track which prompts generate the most content (for optimization)

## Usage Tracking Flow

### 1. Pre-Request Validation
```typescript
// Check limits before API processing
const usageCheck = await checkUsageLimit(userId, 'document')
if (!usageCheck.allowed) {
  return usageLimitResponse(usageCheck)
}
```

### 2. Multi-AI Service Processing
```typescript
// Process with AI provider and track usage automatically
const result = await createAICompletion({
  prompt,
  model: selectedModel, // GPT-4o, Claude 4 Sonnet, etc.
  usageTracking: {
    userId,
    eventType: 'document_generation',
    resourceId: documentId
  }
})
```

### 3. Post-Processing Updates
```typescript
// Update monthly usage aggregates
await updateUsageTracking(userId, 'document_generation', {
  tokensUsed: result.usage.total_tokens,
  estimatedCost: result.estimatedCost
})
```

## Subscription Plans

### Basic Plan ($10/month, first month FREE)
- 100K tokens per month (~75 pages of content)
- $2 AI usage limit (across all providers)
- 3 client profiles
- 20 documents per month
- Unlimited custom prompts

### Pro Plan ($17/month)
- 2M tokens per month (~1,500 pages of content)  
- $12 AI usage limit (across all providers)
- Unlimited client profiles
- 200 documents per month
- Unlimited custom prompts

### Business Plan ($43/month)
- Unlimited tokens and documents
- $35 AI usage limit (across all providers)
- Unlimited client profiles

## How Limits Interact: The Triple-Constraint System

### Limit Hierarchy & Enforcement
The system enforces **three separate limits** (whichever hits first blocks further usage):

1. **Document Limits** - Simple count-based restriction
2. **Token Limits** - Raw token consumption (same counting regardless of model)
3. **Cost Limits** - Actual dollar cost (varies significantly by model)

### Why Token Limits Act as an "Equalizer"

**Key Insight**: Token limits count the same regardless of model cost, which creates important behavioral constraints:

#### Multi-AI Model Cost Differences:
**OpenAI Models:**
- **GPT-4o**: $0.011 per typical document (2K tokens)
- **GPT-4o-mini**: $0.00066 per typical document (2K tokens)

**Anthropic Models:**
- **Claude 4 Opus**: $0.090 per typical document (2K tokens)
- **Claude 4 Sonnet**: $0.018 per typical document (2K tokens)
- **Claude 3.5 Haiku**: $0.0048 per typical document (2K tokens)

#### Real-World Limit Analysis:

**Basic Plan Example** ($10/month: 20 docs, 100K tokens, $2 cost):
```
With GPT-4o-mini:
- Document limit: 20 documents ← Hits first
- Token limit: 50 documents (100K ÷ 2K each)
- Cost limit: ~3,030 documents ($2 ÷ $0.00066)

With GPT-4o:
- Document limit: 20 documents ← Hits first  
- Token limit: 50 documents (100K ÷ 2K each)
- Cost limit: ~182 documents ($2 ÷ $0.011)
```

**Pro Plan Example** ($17/month: 200 docs, 2M tokens, $12 cost):
```
With GPT-4o-mini:
- Document limit: 200 documents ← Hits first
- Token limit: 1,000 documents (2M ÷ 2K each)
- Cost limit: ~18,181 documents ($12 ÷ $0.00066)

With GPT-4o:
- Document limit: 200 documents ← Hits first
- Token limit: 1,000 documents  
- Cost limit: ~1,090 documents ($12 ÷ $0.011)
```

**Business Plan Example** ($43/month: unlimited docs/tokens, $35 cost):
```
With GPT-4o-mini:
- Document limit: unlimited
- Token limit: unlimited
- Cost limit: ~53,030 documents ($35 ÷ $0.00066)

With GPT-4o:
- Document limit: unlimited
- Token limit: unlimited  
- Cost limit: ~3,181 documents ($35 ÷ $0.011)
```

### Benefits of This Design:

1. **Prevents Gaming**: Users can't exploit cheap models to generate massive content volumes
2. **Normalizes Usage**: Same "work effort" regardless of model choice
3. **Infrastructure Protection**: Limits total API calls and processing load
4. **Cost Safety Net**: Expensive models are constrained by cost limits
5. **Predictable Experience**: Users understand they get X documents or Y tokens

### Practical Implications:

- **Token limits** are the real constraint for cost-effective models (GPT-4o-mini, Claude 3.5 Haiku)
- **Cost limits** become active constraints for premium models (Claude 4 Opus, GPT-4o)
- **Document limits** provide baseline protection regardless of provider choice
- **Multi-AI choice** allows users to optimize for their specific cost/quality preferences
- **Cost limits** protect against expensive model overuse (GPT-4o)
- **Document limits** provide the simplest user-facing metric
- Users are encouraged to choose appropriate models for their needs without breaking the business model

This triple-constraint system ensures fair resource allocation while protecting both user experience and business sustainability.

## Analytics and Reporting

### Real-time Usage Info
```typescript
const usage = await getUsageInfo(userId)
// Returns current usage for: documents, clients, tokens, cost
```

### Monthly Analytics
```typescript
const analytics = await getUserUsageAnalytics(userId)  
// Returns: subscription info, limits, current usage, plan details
```

## Implementation Guidelines

### Adding New AI Services
1. Use `withAuthAndUsageCheck('document')` middleware
2. Implement with `createOpenAICompletion()` for automatic tracking
3. Update service documentation

### Cost Management
- All OpenAI calls go through wrapper for consistent cost tracking
- Monthly cost limits prevent unexpected charges
- Token limits provide predictable resource allocation

### Performance Considerations
- Usage checking uses efficient database queries
- Monthly aggregates prevent expensive historical calculations
- Caching used for frequently accessed subscription data

## Security Considerations

### Rate Limiting
- Usage limits act as natural rate limiting
- Prevents abuse and ensures fair resource allocation
- Gradual upgrade path encourages proper usage

### Data Privacy
- Usage tracking respects user privacy
- No content storage in usage tracking
- Aggregated metrics only for business intelligence

### Error Handling
- Usage tracking failures don't break core functionality
- Graceful degradation when tracking is unavailable
- Comprehensive logging for troubleshooting

This usage tracking system ensures accurate billing, prevents abuse, and provides valuable insights while maintaining excellent performance and user experience. The focus on token-based limits provides more accurate cost control and better user experience. 