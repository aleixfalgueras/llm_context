# Usage Tracking System

This document explains how the usage tracking system works for the LLM Context application, focusing on monitoring and limiting AI service usage to manage costs and ensure fair resource allocation.

## Overview

The usage tracking system operates across multiple dimensions:
- **Document generation limits** (count-based)
- **Token consumption tracking** (usage-based)
- **Cost management** (cost-based)
- **Client profile limits** (count-based)

## Database Schema

### UserSubscription Table
Stores subscription plan details and limits:

```sql
model UserSubscription {
  -- Plan Limits
  maxClients              Int     -- Basic: 3, Pro: unlimited (-1), Business: unlimited (-1)
  maxDocumentsPerMonth    Int     -- Basic: 20, Pro: 200, Business: unlimited (-1)
  maxTokensPerMonth       Int     -- Basic: 100K, Pro: 2M, Business: unlimited (-1)
  maxCostPerMonth         Float   -- Basic: $2, Pro: $25, Business: unlimited (-1)
  
  -- Plan Features
  
}
```

### UserUsage Table
Tracks monthly usage aggregates:

```sql
model UserUsage {
  documentsGenerated Int     -- Total documents generated this month
  tokensUsed        Int     -- Total tokens consumed this month  
  estimatedCost     Float   -- Estimated OpenAI costs this month
}
```

## Service-Specific Usage Tracking

### Document Generation Services
All AI services that generate content track:

1. **Meeting Report Generator**
   - Document count increment
   - Token usage (prompt + completion)
   - Estimated OpenAI cost
   - Model used (for analytics)

2. **Custom Document Generator**
   - Document count increment  
   - Token usage (prompt + completion)
   - Estimated OpenAI cost
   - Template used (for analytics)

3. **Chat/Assistant Service**
   - Treated as document generation
   - Token usage tracking
   - Cost monitoring per conversation

### Client Management
- **Limit Type**: Real-time count of existing client profiles
- **No Usage Tracking**: Users can delete/recreate clients up to their limit
- **Enforcement**: Checked before client creation

### Prompt Management
- **No Limits**: Users can create unlimited custom prompts
- **No Usage Tracking**: Prompts are treated as templates, not AI services
- **Storage Only**: Prompts stored in database without restrictions

## Usage Tracking Flow

### 1. Pre-Request Validation
```typescript
// Check limits before API processing
const usageCheck = await checkUsageLimit(userId, 'document')
if (!usageCheck.allowed) {
  return usageLimitResponse(usageCheck)
}
```

### 2. AI Service Processing
```typescript
// Process with OpenAI and track usage automatically
const result = await createOpenAICompletion({
  prompt,
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

### Basic Plan (€9/month, first month FREE)
- 100K tokens per month (~75 pages of content)
- $2 OpenAI usage limit
- 3 client profiles
- 20 documents per month
- Unlimited custom prompts
- Email support

### Pro Plan (€15/month)
- 2M tokens per month (~1,500 pages of content)  
- $25 OpenAI usage limit
- Unlimited client profiles
- 200 documents per month
- Unlimited custom prompts
- Premium features and support

### Business Plan (€39/month)
- Unlimited tokens and OpenAI usage
- Unlimited everything
- Team collaboration features
- Priority support and custom branding

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