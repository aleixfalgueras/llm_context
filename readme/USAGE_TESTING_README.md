# Usage Limit Testing Scripts

This directory contains scripts for testing usage limits and subscription behavior in the LLM Context application.

## Overview

These scripts help you test the application's behavior when users reach their subscription limits by manipulating the `UserUsage` table directly.

## Scripts

### 1. `set-usage-to-max.ts`

Sets a user's usage to the maximum limits for their subscription plan.

**Usage:**
```bash
tsx scripts/set-usage-to-max.ts <userId> <planName>
```

**Parameters:**
- `userId`: The Clerk user ID (e.g., `user_2abc123def456`)
- `planName`: One of `basic`, `pro`, or `business`

**Examples:**
```bash
# Set basic plan user to maximum limits
tsx scripts/set-usage-to-max.ts user_2abc123def456 basic

# Set pro plan user to maximum limits  
tsx scripts/set-usage-to-max.ts user_2abc123def456 pro

# Set business plan user to high usage (simulates heavy usage)
tsx scripts/set-usage-to-max.ts user_2abc123def456 business
```

**What it does:**
1. Creates or updates the user's subscription to the specified plan
2. Sets the current month's usage to maximum limits (using the centralized configuration from `lib/subscription-utils.ts`):
   - **Basic Plan**: Unlimited documents, 100K tokens, $2.00 cost
- **Pro Plan**: Unlimited documents, 2M tokens, $25.00 cost
   - **Business Plan**: 1000 documents, 10M tokens, $40.00 cost (simulated heavy usage)

### 2. `reset-usage.ts`

Resets a user's usage back to zero for the current month.

**Usage:**
```bash
tsx scripts/reset-usage.ts <userId>
```

**Parameters:**
- `userId`: The Clerk user ID

**Example:**
```bash
tsx scripts/reset-usage.ts user_2abc123def456
```

**What it does:**
1. Sets the current month's usage to zero:
   - Documents generated: 0
   - Tokens used: 0
   - Estimated cost: $0.00

## Testing Workflow

### Testing Limit Reached Behavior

1. **Set user to maximum usage:**
   ```bash
   tsx scripts/set-usage-to-max.ts user_2abc123def456 basic
   ```

2. **Test the application:**
   - Try to create a new document - should be blocked
   - Check `/api/subscription/usage-info` for usage data
   - Test upgrade prompts and messaging
   - Verify UI shows limit warnings

3. **Reset usage for continued testing:**
   ```bash
   tsx scripts/reset-usage.ts user_2abc123def456
   ```

### Testing Different Plan Limits

```bash
# Test basic plan limits
tsx scripts/set-usage-to-max.ts user_123 basic

# Test pro plan limits  
tsx scripts/set-usage-to-max.ts user_123 pro

# Test business plan behavior (high usage but no limits)
tsx scripts/set-usage-to-max.ts user_123 business
```

## Plan Limits

### Basic Plan ($10/month)
- **Documents**: Unlimited per month
- **Tokens**: 100,000 per month (~75 pages)
- **Cost**: $2.00 OpenAI spending limit
- **Clients**: 3 total

### Pro Plan ($17/month)
- **Documents**: Unlimited per month
- **Tokens**: 2,000,000 per month (~1,500 pages)
- **Cost**: $25.00 OpenAI spending limit
- **Clients**: Unlimited (-1)

### Business Plan ($43/month)
- **Documents**: Unlimited (-1)
- **Tokens**: Unlimited (-1)
- **Cost**: $40.00 OpenAI spending limit
- **Clients**: Unlimited (-1)

*Note: For Business plan testing, the script sets high but finite values since the database needs actual numbers.*

## Database Impact

These scripts modify the following tables:
- `user_subscriptions`: Updates plan and limits
- `user_usage`: Creates/updates monthly usage records

**Important**: These scripts only affect the current month's usage. Historical usage data is preserved.

## API Endpoints to Test

After running the scripts, test these endpoints:

1. **Usage Info**: `GET /api/subscription/usage-info`
   - Returns current usage and limits
   - Should show limits reached after running set-usage-to-max

2. **Document Creation**: Any document generation endpoint
   - Should return 429 status when limits are reached
   - Should include upgrade messaging

3. **Client Creation**: `POST /api/clients`
   - Test client limits (if applicable to plan)

## Troubleshooting

### Script Errors

**"User not found"**: The script will automatically create a basic subscription if none exists.

**"Invalid plan name"**: Ensure you're using exactly `basic`, `pro`, or `business`.

**Database connection errors**: Ensure your `.env` file has the correct `DATABASE_URL`.

### Testing Issues

**Limits not enforced**: 
- Check that the usage middleware is working
- Verify the API endpoints are checking limits properly
- Ensure the current month matches the usage record

**Usage not updating**: 
- Check that the current month/year in the database matches
- Verify the `userId` matches exactly with Clerk

## Client Context Testing

When testing AI services and chat functionality, remember to test the expanded client context system:

### Client Profile Fields Available:
- **Country**: Client's country/location
- **General Context**: General information about the client
- **Specific Context 1**: Additional specific context field
- **Specific Context 2**: Additional specific context field  
- **Specific Context 3**: Additional specific context field

### Context Selection Testing:
- Test selecting individual fields vs. multiple fields
- Verify privacy compliance - only selected fields should be included
- Test that context appears correctly in AI responses
- Verify fallback behavior when country is not selected

## Development Notes

- Scripts use the current month/year automatically
- Business plan uses simulated high values since "unlimited" needs actual numbers
- The `userId` must exactly match the Clerk user ID format
- Scripts include proper error handling and database cleanup
- Client context system now supports up to 5 different context fields for granular privacy control

## Clean Up

To clean up test data:
```bash
# Reset a user's usage
tsx scripts/reset-usage.ts user_123

# Or manually delete usage records from the database
# DELETE FROM user_usage WHERE userId = 'user_123';
``` 