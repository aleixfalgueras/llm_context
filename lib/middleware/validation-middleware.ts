import {auth} from "@clerk/nextjs/server";
import {logger} from "@/lib/logger";
import {ModelTier} from "@/lib/types/subscription-types";
import {getTierFromPlan, isModelAvailableForTier} from "@/lib/ai/models-config";
import {SubscriptionUsageService} from "@/services/subscription-usage-service";
import {prisma} from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";
import {TokenUsageValidationResult, ValidationErrorDetails} from "@/lib/types/middleware-validation-types";
import {SubscriptionErrorCode} from "@/lib/api/api-error-codes";

/**
 * Simple authentication middleware that validates user authentication via Clerk.
 * 
 * This middleware function provides the foundational authentication layer for API routes
 * by validating the user's authentication status through Clerk's auth system. It serves
 * as the entry point for all authenticated API endpoints.
 * 
 * @returns Promise<string> - The authenticated user's unique identifier from Clerk
 * 
 * @throws Error - Throws 'Unauthorized' error if user is not authenticated
 *   - No valid session found
 *   - Invalid or expired authentication token
 *   - User session has been revoked
 * 
 * **Authentication Flow:**
 * 1. Calls Clerk's auth() function to retrieve session information
 * 2. Extracts userId from the authentication context
 * 3. Validates that userId exists and is not null/undefined
 * 4. Returns userId for use in subsequent middleware or API logic
 * 
 * **Integration Pattern:**
 * - Should be the first middleware called in API route handlers
 * - Return value used for all user-specific database operations
 * - Error automatically handled by API error handling middleware
 *
 * **Security Notes:**
 * - Relies on Clerk's session validation for security
 * - Does not perform additional authorization checks (use withClientAccess for resource access)
 * - Essential for protecting all user-specific API endpoints
 */
export async function withAuth(): Promise<string> {
  const {userId} = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

/**
 * Client access validation middleware that verifies user ownership of client resources.
 * 
 * This middleware enforces resource-level authorization by validating that the authenticated
 * user has legitimate access to the specified client. It prevents unauthorized access to
 * client data and ensures proper data isolation between users.
 * 
 * @param userId - The authenticated user ID (typically from withAuth())
 * @param clientId - The client ID being accessed
 * 
 * @returns Promise<Client> - Complete client object if access is granted:
 *   - All client fields from the database
 *   - Confirms ownership relationship
 *   - Ready for use in business logic
 * 
 * @throws Error - Throws error with proper HTTP status if access denied:
 *   - 404 status: Client not found or user doesn't own the client
 *   - Error message: 'Client not found'
 *   - Prevents information disclosure about client existence
 * 
 * **Authorization Logic:**
 * 1. Queries database for client with matching ID and user ID
 * 2. Uses composite WHERE clause to ensure both client existence and ownership
 * 3. Returns complete client object if both conditions met
 * 4. Throws 404 error if either condition fails (security through obscurity)
 * 
 * **Database Query:**
 * - Uses findFirst for efficient single-record retrieval
 * - Composite WHERE clause prevents SQL injection and ensures data isolation
 * - No sensitive data exposure in error responses
 * 
 * **Security Features:**
 * - Prevents horizontal privilege escalation (user accessing other users' clients)
 * - Consistent error response prevents client enumeration attacks
 * - Validates ownership at the database level for accuracy
 * 
 * **Integration Pattern:**
 * - Called after withAuth() to validate resource access
 * - Return value used directly in business logic
 * - Error handling managed by API error middleware
 */
export async function withClientAccess(userId: string, clientId: string): Promise<any> {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  })

  if (!client) {
    const error = new Error('Client not found')
    ;(error as any).status = 404
    throw error
  }

  return client
}

/**
 * Token usage validation middleware that enforces monthly token limits before AI operations.
 * 
 * This middleware validates that users haven't exceeded their subscription-based monthly
 * token quotas before allowing expensive AI operations. It integrates with the subscription
 * system to enforce usage limits and prevent quota overages.
 * 
 * @param userId - The authenticated user ID (typically from withAuth())
 * 
 * @returns Promise<void> - Resolves silently if validation passes
 * 
 * @throws Error - Throws standardized validation error if limits exceeded:
 *   - Uses throwValidationError() for consistent error formatting
 *   - HTTP status codes: 402 (expired subscription) or 429 (quota exceeded)
 *   - Includes detailed error metadata for client handling
 *   - Provides upgrade URLs and usage statistics
 * 
 * **Validation Flow:**
 * 1. Calls getTokenUsageLimit() to check current usage against subscription limits
 * 2. Evaluates validation result to determine if request should proceed
 * 3. If validation fails, throws standardized error with proper HTTP status
 * 4. If validation passes, continues silently to next middleware
 * 
 * **Error Scenarios:**
 * - **Subscription Expired (402):** User's subscription is no longer active
 * - **Quota Exceeded (429):** User has reached monthly token limit
 * - **System Error (500):** Validation service unavailable (falls back to denial)
 * 
 * **Integration with Subscription System:**
 * - Leverages centralized token usage tracking
 * - Respects subscription tiers and plan limits
 * - Enforces numeric token limits for all plans
 * - Provides real-time usage validation
 * 
 * **Error Handling Standardization:**
 * - Uses createValidationErrorDetails() for consistent error structure
 * - Separates business logic from HTTP concerns
 * - Provides rich metadata for client error handling
 * - Includes upgrade paths and usage statistics
 *
 */
export async function withTokenValidation(userId: string): Promise<void> {
  const validationResult = await SubscriptionUsageService.getTokenUsageValidationResult(userId);

  if (!validationResult.allowed) {
    throwTokenValidationError(validationResult);
  }
}

/**
 * Create and throw a standardized validation error from token validation result.
 * 
 * This utility function provides a clean interface for converting validation failures
 * into properly formatted HTTP errors. It combines error detail creation with error
 * throwing to ensure consistent error handling across all validation middleware.
 * 
 * @param validationResult - The token validation result from getTokenUsageLimit()
 * @param validationResult.allowed - Whether the validation passed
 * @param validationResult.limit - Token limit (number)
 * @param validationResult.used - Current token usage
 * @param validationResult.remaining - Remaining tokens (if applicable)
 * @param validationResult.reason - Error code for validation failure
 * 
 * @throws Error - Never returns, always throws formatted error:
 *   - **message:** Human-readable error message for users
 *   - **code:** API error code for client error handling
 *   - **status:** HTTP status code (402 for expired, 429 for quota exceeded)
 *   - **metadata:** Rich error details including usage stats and upgrade URL
 * 
 * @returns never - This function never returns, it always throws
 * 
 * **Error Metadata Structure:**
 * - limitType: Always 'tokens' for token-based validation
 * - used: Current monthly token consumption
 * - limit: Monthly token limit from subscription
 * - remaining: Tokens remaining in current period (if applicable)
 * - upgradeUrl: Direct link to subscription upgrade page
 * 
 * **HTTP Status Code Mapping:**
 * - **402 Payment Required:** Subscription expired or inactive
 * - **429 Too Many Requests:** Monthly quota exceeded
 * 
 * **Integration with Error Handling:**
 * - Works with API error middleware to provide consistent responses
 * - Error metadata used by frontend for user-friendly error displays
 * - Status codes trigger appropriate client-side error handling
 * 
 * **Design Pattern:**
 * - Separates error creation logic from validation logic
 * - Centralizes error formatting for consistency
 * - Enables easy testing and maintenance of error responses
 * 
 * **Never Returns:**
 * This function is typed to return `never` because it always throws an error.
 * The TypeScript compiler understands this and won't expect code after the call.
 */
export function throwTokenValidationError(validationResult: TokenUsageValidationResult): never {
  const errorDetails = createTokenValidationErrorDetails(validationResult);
  const error = new Error(errorDetails.message);

  // Add metadata to error for proper response handling
  (error as any).code = errorDetails.code;
  (error as any).status = errorDetails.status;
  (error as any).metadata = errorDetails.metadata;

  throw error;
}

/**
 * Create standardized validation error details from token validation result.
 * 
 * This function centralizes the complex logic for mapping token validation failures
 * to properly structured HTTP error responses. It ensures consistent error formatting,
 * appropriate status codes, and rich metadata across all subscription validation scenarios.
 * 
 * @param validationResult - The token validation result from getTokenUsageLimit()
 * @param validationResult.allowed - Whether validation passed (should be false when called)
 * @param validationResult.limit - Token limit (number)
 * @param validationResult.used - Current monthly token usage
 * @param validationResult.remaining - Remaining tokens in current period
 * @param validationResult.reason - Specific error code for validation failure
 * 
 * @returns ValidationErrorDetails - Structured error details object:
 *   - **code:** API error code from ApiSubscriptionErrorCode enum
 *   - **status:** HTTP status code (402 or 429)
 *   - **message:** User-friendly error message with usage statistics
 *   - **metadata:** Rich error context for client error handling
 * 
 * **Error Code Mapping:**
 * - **SUBSCRIPTION_EXPIRED → 402:** Subscription is inactive or expired
 * - **USAGE_LIMIT_EXCEEDED → 429:** Monthly token quota has been reached
 * 
 * **Message Formatting:**
 * - **Expired Subscription:** Generic message with upgrade prompt
 * - **Quota Exceeded:** Detailed usage statistics with formatted numbers
 * - Includes specific limit and current usage for transparency
 * - Uses toLocaleString() for human-readable number formatting
 * 
 * **Metadata Structure:**
 * - **limitType:** Always 'tokens' for token-based validation
 * - **used:** Current monthly token consumption (number)
 * - **limit:** Monthly limit from subscription (number)
 * - **remaining:** Tokens remaining this period (number or undefined)
 * - **upgradeUrl:** Direct path to subscription management page
 * 
 * **Status Code Logic:**
 * - **402 Payment Required:** Used for subscription status issues
 * - **429 Too Many Requests:** Used for rate limiting / quota exceeded
 * - Follows HTTP standards for subscription and rate limiting errors
 * 
 * **Localization Support:**
 * - Uses toLocaleString() for number formatting
 * - Consistent message structure for translation systems
 * - Structured metadata for client-side localization
 * 
 * **Frontend Integration:**
 * - Error metadata provides all necessary data for user-friendly error displays
 * - Status codes enable appropriate client-side error handling logic
 * - Upgrade URLs provide direct paths for subscription management
 */
export function createTokenValidationErrorDetails(validationResult: TokenUsageValidationResult): ValidationErrorDetails {
  const isExpired = validationResult.reason === SubscriptionErrorCode.SUBSCRIPTION_EXPIRED;

  return {
    code: validationResult.reason || SubscriptionErrorCode.USAGE_LIMIT_EXCEEDED,
    status: isExpired ? 402 : 429,
    message: isExpired
      ? 'Your subscription has expired. Please upgrade to continue using AI features.'
      : `You've reached your monthly token limit of ${validationResult.limit.toLocaleString()} tokens. You've used ${validationResult.used.toLocaleString()} tokens this month. Upgrade your plan to continue.`,
    metadata: {
      limitType: 'tokens',
      used: validationResult.used,
      limit: validationResult.limit,
      remaining: validationResult.remaining,
      upgradeUrl: '/subscription'
    }
  };
}

/**
 * Check if user can access a specific AI model based on their subscription tier.
 * 
 * This function validates whether a user's current subscription plan provides access
 * to the requested AI model. It combines subscription status checking with tier-based
 * model availability to enforce subscription-based model restrictions.
 * 
 * @param userId - The authenticated user ID
 * @param modelId - The AI model identifier to check access for
 * 
 * @returns Promise<ModelAccessResult> - Model access validation result:
 *   **For Active Subscriptions with Access:**
 *   - allowed: true
 *   - tier: User's subscription tier (e.g., ModelTier.PRO)
 *   - plan: Current subscription plan (e.g., SubscriptionPlan.PRO)
 *   - modelId: The requested model identifier
 * 
 *   **For Active Subscriptions without Access:**
 *   - allowed: false
 *   - tier: User's subscription tier
 *   - plan: Current subscription plan
 *   - modelId: The requested model identifier
 * 
 *   **For Inactive Subscriptions:**
 *   - allowed: false
 *   - tier: ModelTier.BASIC (fallback)
 *   - plan: Current subscription plan (even if inactive)
 *   - modelId: The requested model identifier
 *   - reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
 * 
 *   **For System Errors:**
 *   - allowed: false (safe fallback)
 *   - tier: ModelTier.BASIC (minimum tier)
 *   - plan: SubscriptionPlan.BASIC (minimum plan)
 *   - modelId: The requested model identifier
 * 
 * @throws Never throws - Returns safe fallback values on error
 * 
 * **Validation Flow:**
 * 1. Retrieve user's current subscription details
 * 2. Check if subscription is currently active (not expired/canceled)
 * 3. If inactive, return denial with SUBSCRIPTION_EXPIRED reason
 * 4. If active, determine user's tier from subscription plan
 * 5. Check if requested model is available for that tier
 * 6. Return access result with tier and plan information
 * 
 * **Subscription Status Validation:**
 * - Uses SubscriptionUsageService.isSubscriptionActive() for comprehensive status checking
 * - Considers expiration dates, cancellation status, and payment status
 * - Logs detailed information for inactive subscriptions
 * 
 * **Tier-Based Model Access:**
 * - Maps subscription plans to model tiers using getTierFromPlan()
 * - Validates model availability using isModelAvailableForTier()
 * - Supports hierarchical model access (higher tiers include lower tier models)
 * 
 * **Performance Monitoring:**
 * - Comprehensive timing measurement with user context
 * - Performance threshold monitoring for optimization
 * - Detailed logging for subscription and model access patterns
 * 
 * **Error Handling:**
 * - Safe fallback prevents model access on system errors
 * - Comprehensive error logging for debugging subscription issues
 * - Non-throwing behavior maintains API stability
 *
 * **Security Considerations:**
 * - Prevents access to premium models on basic subscriptions
 * - Validates subscription status in real-time
 * - Provides detailed access context for proper error handling
 */
export async function checkModelAccess(userId: string, modelId: string) {
  const endTiming = logger.startTiming('Check Model Access', {userId});

  try {
    const subscription = await SubscriptionUsageService.getUserSubscription(userId)

    // Check if subscription is active first
    if (!SubscriptionUsageService.isSubscriptionActive(subscription)) {
      logger.warn('Subscription is not active for model access check', {
        userId,
        metadata: {
          modelId,
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
      endTiming();
      return {
        allowed: false,
        tier: ModelTier.BASIC,
        plan: subscription.plan,
        modelId,
        reason: SubscriptionErrorCode.SUBSCRIPTION_EXPIRED
      }
    }

    const tier = getTierFromPlan(subscription.plan)
    const hasAccess = isModelAvailableForTier(modelId, tier)

    endTiming();
    return {
      allowed: hasAccess,
      tier,
      plan: subscription.plan,
      modelId
    }
  } catch (error) {
    logger.error('Error checking model access', error as Error, {
      userId,
      metadata: {modelId}
    });
    endTiming();
    return {allowed: false, tier: ModelTier.BASIC, plan: SubscriptionPlan.basic, modelId}
  }
}