# Model Tiers Usage Tracking System

This document explains how the model tiers usage tracking system works for the LLM Context application, focusing on **token consumption monitoring**, **tier-based model access**, and **sustainable business operations**.

## Overview

The usage tracking system operates across **four primary dimensions**:
- **Model tier access control** (subscription-based)
- **Token consumption tracking** (usage-based)
- **Document generation limits** (count-based)
- **Storage usage tracking** (storage-based)

**Key Features:**
- ✅ **Model tiers** restrict access to expensive models by subscription level
- ✅ **Business pays OpenRouter** costs from subscription revenue
- ✅ **Token limits calculated** based on most expensive model in each tier
- ✅ **Storage limits** prevent runaway storage costs and ensure sustainable operations
- ✅ **Guaranteed profit margins** at all subscription levels
- ✅ **Server-side validation** ensures users only access models in their tier

## Database Schema

### UserSubscription Table
Stores subscription plan details and limits:

```sql
model UserSubscription {
  -- Plan Limits (Model Tiers Based)
  maxClients              Int     -- Basic: 3, Pro: unlimited (-1), Business: unlimited (-1)
  maxDocumentsPerMonth    Int     -- All plans: unlimited (-1)
  maxTokensPerMonth       Int     -- Basic: 100K, Pro: 1.6M, Business: 4.5M
  
  -- Token limits calculated based on most expensive model in tier for profitability
  -- Storage limits are enforced separately through storage-utils.ts
}
```

### UserUsage Table
Tracks monthly usage aggregates:

```sql
model UserUsage {
  -- documentsGenerated field removed - documents are unlimited
  tokensUsed        Int     -- Total tokens consumed this month (primary metric)
  
  -- No cost tracking - business pays OpenRouter directly
}
```

### Storage Usage Tracking
Storage usage is tracked separately from monthly usage aggregates:

- **Real-time calculation**: Storage usage is calculated on-demand by measuring actual file sizes
- **Per-user tracking**: Total storage consumption across all documents
- **Per-client breakdown**: Storage usage segmented by client for analytics
- **Plan-based limits**: Storage limits enforced based on subscription plan
- **Efficient validation**: Storage checks performed before document save operations

## Service-Specific Usage Tracking

### Document Generation Services
All AI services that generate content track:

1. **Meeting Report Generator**
   - Document count increment
   - Token usage (prompt + completion)
   - Model used (for analytics)

2. **Custom Document Generator**
   - Document count increment  
   - Token usage (prompt + completion)
   - Template used (for analytics)

3. **Chat/Assistant Service**
   - Treated as document generation
   - Token usage tracking across all models
   - Conversation context tracking

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

// Check storage limits for document saving operations
await validateDocumentStorage(documentContent, userId)
// Throws error if storage limit would be exceeded
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
  model: selectedModel, // Validated model from user's tier
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
  // No cost tracking - business pays OpenRouter directly
})
```

## Subscription Plans & Model Tiers

### Basic Plan ($10/month)
- **100K tokens per month** (~75 pages of content)
- **3 client profiles**
- **50 MB document storage**
- **Unlimited documents per month**
- **Basic tier models**: GPT-4o Mini, Claude Haiku, Gemini Flash
- **91% profit margin** (worst-case: $0.875 AI cost)

### Pro Plan ($17/month)
- **1.6M tokens per month** (~1,200 pages of content)  
- **Unlimited client profiles**
- **200 MB document storage**
- **Unlimited documents per month**
- **Pro tier models**: GPT-4o, Claude Sonnet, Gemini Pro + all basic models
- **15% profit margin** (worst-case: $14.40 AI cost)

### Business Plan ($43/month)
- **4.5M tokens per month** (~3,400 pages of content)
- **Unlimited client profiles**
- **2 GB document storage**
- **Unlimited documents per month**
- **Pro tier models**: GPT-4o, Claude Sonnet, Gemini Pro + all basic models
- **6% profit margin** (worst-case: $40.50 AI cost)

## Simplified Limit System: Dual-Constraint Model

### Limit Hierarchy & Enforcement
The system enforces **three primary limits** (whichever hits first blocks further usage):

1. **Document Limits** - Simple count-based restriction
2. **Token Limits** - Raw token consumption (fair across all models)
3. **Storage Limits** - Total document storage consumption

### Why This Works Better

**Token Limit Benefits:**
- **Fair across models**: 1 token = 1 token regardless of model cost
- **Predictable**: Users understand token consumption patterns
- **No gaming**: Can't exploit cheap models for massive content generation
- **Resource protection**: Limits total API calls and processing load

**Storage Limit Benefits:**
- **Cost control**: Prevents runaway storage infrastructure costs
- **Resource management**: Ensures server storage capacity planning
- **Fair usage**: Storage limits scale appropriately with plan pricing
- **Sustainable growth**: Storage costs remain predictable as user base grows

**Example: Model Tier Cost Management**
```
Basic Tier Models (Cost-Effective):
• GPT-4o Mini: $0.000375 per 1K tokens
• Claude 3 Haiku: $0.000875 per 1K tokens (most expensive basic)
• Gemini Flash: $0.0005 per 1K tokens

Pro Tier Models (Premium):
• GPT-4o: $0.006125 per 1K tokens
• Claude 3.5 Sonnet: $0.009 per 1K tokens (most expensive pro)
• Gemini Pro: $0.001 per 1K tokens

Token limits calculated based on worst-case model in each tier → guaranteed profitability
```

**Limit Analysis:**

**Basic Plan Example** (20 docs, 100K tokens):
```
Token limit ensures fair usage:
- 50 standard documents (2K tokens each) OR
- 25 complex documents (4K tokens each) OR  
- 100 short posts (1K tokens each)

Document limit provides baseline protection:
- Unlimited documents
```

**Pro Plan Example** (200 docs, 2M tokens):
```
Professional usage support:
- 1,000 standard documents (2K tokens each) OR
- 500 comprehensive reports (4K tokens each)
- Unlimited documents
```

**Business Plan** (unlimited):
```
Enterprise flexibility:
- No token restrictions
- No document restrictions
- Direct OpenRouter billing for actual usage
```

## Model Access Control Implementation

### Tier-Based Model Validation
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
  basic: [
    'openai/gpt-4o-mini',        // $0.000375/1K tokens
    'anthropic/claude-3-haiku',   // $0.000875/1K tokens (most expensive)
    'google/gemini-flash',        // $0.0005/1K tokens
  ],
  pro: [
    'openai/gpt-4o',             // $0.006125/1K tokens  
    'anthropic/claude-3.5-sonnet', // $0.009/1K tokens (most expensive)
    'google/gemini-pro',         // $0.001/1K tokens
    // Pro tier also includes all basic tier models
    ...MODEL_TIERS.basic
  ],
}
```

### Frontend Model Selector
```typescript
// Enhanced model selector with tier-based filtering
<ModelSelector 
  selectedModel={selectedModel}
  onModelSelect={handleModelChange}
  userTier={subscription.tier} // 'basic' or 'pro'
/>
```

## Analytics and Reporting

### Real-time Usage Info
```typescript
const usage = await getUsageInfo(userId)
// Returns current usage for: documents, clients, tokens, storage
// Plus subscription tier and model access information
// Storage usage includes: used bytes, formatted display, percentage used
```

### Monthly Analytics
```typescript
const analytics = await getUserUsageAnalytics(userId)  
// Returns: subscription info, limits, current usage, plan details, tier access
// Metrics focused on consumption patterns and model usage
```

## Implementation Guidelines

### Adding New AI Services
1. Use `withAuthAndUsageCheck('document')` middleware
2. Implement with `createOpenRouterCompletion()` for automatic tracking
3. Focus on token consumption metrics

### Token Management
- All OpenRouter calls track tokens automatically
- Monthly token limits prevent resource abuse
- Document limits provide secondary protection

### Performance Considerations
- Usage checking uses efficient database queries
- Monthly aggregates prevent expensive historical calculations
- Token-only tracking reduces database complexity

## Security Considerations

### Rate Limiting
- Token limits act as natural rate limiting
- Document limits prevent bulk generation abuse
- Gradual upgrade path encourages proper usage

### Data Privacy
- Usage tracking respects user privacy
- No content storage in usage tracking
- Aggregated metrics only for business intelligence

### Error Handling
- Usage tracking failures don't break core functionality
- Graceful degradation when tracking is unavailable
- Comprehensive logging for troubleshooting

## Benefits of Simplified Approach

### **For Users:**
- **Clear resource understanding**: Token consumption is intuitive
- **Model freedom**: Choose optimal models without billing complexity
- **Transparent costs**: Direct OpenRouter billing relationship
- **Predictable experience**: Token limits work consistently across models

### **For Development:**
- **Reduced complexity**: No cost calculation or estimation logic
- **Easier maintenance**: OpenRouter handles pricing updates
- **Better performance**: Fewer database operations and calculations
- **Focus on features**: Less time on billing infrastructure

### **For Business:**
- **Zero AI cost risk**: Users pay OpenRouter directly
- **Higher margins**: 100% subscription revenue
- **Scalable model**: Growth doesn't increase our AI costs
- **Operational simplicity**: No cost management overhead

---

This simplified token-based usage tracking system provides **accurate resource management** while maintaining excellent performance and user experience. The focus on token consumption ensures fair resource allocation and eliminates the complexity of cost estimation across 400+ models. 