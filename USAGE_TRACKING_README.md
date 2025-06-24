# Usage Tracking System Documentation

This document provides information about the usage tracking system implemented in the LLM Context application.

## 🎯 Overview

The usage tracking system monitors user interactions with AI services, enforces subscription limits, and provides detailed analytics for billing and optimization.

**Key Features:**
- **Real-time Monitoring**: Tracks all AI service interactions
- **Limit Enforcement**: Prevents users from exceeding subscription plan limits
- **Cost Calculation**: Estimates OpenAI API costs and token consumption
- **Analytics**: Provides monthly usage insights for billing
- **Multi-dimensional Limits**: Count-based, token-based, and cost-based restrictions

## 🏗️ Database Schema

### UserUsage Table - Monthly Aggregated Data
Tracks monthly usage statistics per user including:
- Conversations used, documents generated, prompts used
- Token consumption and estimated costs
- Year/month tracking with unique constraints

### UserSubscription Table - Plan Limits
Defines subscription plan limits:
- **Free Plan**: 50 conversations, 20 documents, 3 clients, 10 prompts, 100K tokens, $2 cost limit
- **Pro Plan**: 500 conversations, 200 documents, unlimited clients/prompts, 2M tokens, $25 cost limit  
- **Business Plan**: Unlimited usage across all dimensions

## 🔄 Usage Tracking Flow

**Process Flow:**
1. User initiates AI service request
2. API middleware checks authentication and usage limits
3. If allowed, service executes with automatic tracking
4. OpenAI API call tracks tokens and calculates costs
5. Monthly usage counters updated directly
6. Cache refreshed for performance

**Block Points:**
- Authentication failure → 401 Unauthorized
- Usage limit exceeded → 429 Too Many Requests with upgrade message
- Service errors → 500 Internal Server Error

## 📈 Tracking Points Across Services

### AI Services Overview

**Meeting Report Generator** 🟣
- Converts meeting transcriptions into professional reports
- Tracks as document_generation event type
- Supports file uploads and multi-language generation

**Custom Document Generator** 🔵
- Creates marketing documents using custom prompts
- Integrates with prompt library system
- Supports variable replacement and client context

### Service-Specific Tracking

**AI Services**: Document generation events with metadata (document type, client ID, model used)

**Assistant Chat**: Conversation events with message count and model information

**Document Storage**: Automatic tracking when documents are saved to Supabase

**Prompt Usage**: Individual prompt usage increments in database

**Chat Exports**: Document generation events when chat conversations are saved

## 🔍 Usage Limit Enforcement

**Multi-Dimensional Checks:**
- **Conversation Limits**: Monthly conversation count vs plan limit
- **Document Limits**: Monthly document generation vs plan limit
- **Token Limits**: Total monthly token consumption vs plan allowance
- **Cost Limits**: Estimated OpenAI costs vs monthly budget
- **Client Limits**: Current total client count vs plan limit (not creation events)
- **Prompt Limits**: Current total prompt count vs plan limit

**Enforcement Points:**
- API middleware blocks requests before processing
- Document save operations check limits before storage
- Real-time validation prevents limit overruns
- Graceful error messages guide users to upgrade

## 📊 Analytics & Reporting

**Usage Information API** (`/api/subscription/usage-info`):
- Cached usage data (30-second cache duration)
- Real-time limit checking across all dimensions
- Returns usage statistics for dashboard display

**Subscription Analytics** (`/api/subscription/analytics`):
- Comprehensive usage analytics for administrative purposes
- Plan details, limits, current usage, and projections
- Historical data for billing and optimization

**Key Metrics Tracked:**
- Service popularity and adoption rates
- Token consumption patterns by service
- Cost optimization opportunities
- User engagement and feature utilization

## 🔐 Security & Privacy

**Data Protection:**
- All usage data tied to authenticated user sessions (Clerk)
- Complete data isolation between users
- No personal client data stored in usage events
- Secure token and cost calculations

**Performance Optimization:**
- Caching prevents excessive database queries
- Background tracking doesn't impact main functionality
- Efficient database operations with proper indexing
- Graceful error handling for tracking failures

## 📝 Implementation Guidelines

**For New Services:**
1. Use `withAuthAndUsageCheck` middleware for all AI endpoints
2. Implement automatic tracking via `createOpenAICompletion` wrapper
3. Enable usage tracking in document save operations (`trackUsage: true`)
4. Include relevant metadata for analytics and debugging

**Best Practices:**
- Always validate authentication before usage checking
- Handle tracking errors gracefully without breaking functionality
- Use specific event types for accurate categorization
- Include contextual metadata for better analytics
- Cache usage information to reduce database load

**Common Issues & Solutions:**
- **Usage not tracked**: Verify middleware implementation
- **Incorrect limits**: Check subscription plan configuration  
- **Stale data**: Clear usage info cache
- **Token miscalculation**: Ensure OpenAI response includes usage data
- **Database errors**: Verify Prisma connection and schema

## 🚀 Monitoring & Maintenance

**Key Monitoring Points:**
- Usage pattern anomalies (unusual spikes)
- Service performance and success rates
- Cost optimization opportunities
- Database performance and query efficiency

**Regular Maintenance:**
- Monitor cache hit rates and effectiveness
- Review and adjust subscription plan limits
- Analyze usage patterns for feature development

This usage tracking system ensures accurate billing, prevents abuse, and provides valuable insights while maintaining excellent performance and user experience. 