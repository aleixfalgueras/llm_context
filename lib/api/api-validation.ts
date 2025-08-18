import {auth} from "@clerk/nextjs/server";
import {logger} from "@/lib/logger";
import {getTierFromPlan, isModelAvailableForTier} from "@/lib/models-config";
import {SubscriptionUsageService} from "@/services/subscription/subscription-usage-service";
import {SubscriptionService} from "@/services/subscription/subscription-service";
import {SubscriptionErrorCode} from "@/services/error-codes";

/**
 * Validates user authentication via Clerk and returns the user ID.
 * 
 * @returns Promise<string> The authenticated user's ID
 * @throws Error 'Unauthorized' if user is not authenticated
 */
export async function checkAuth(): Promise<string> {
  const {userId} = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

/**
 * Validates user hasn't exceeded monthly token limits before AI operations.
 * 
 * @param userId The authenticated user ID
 * @returns Promise<void> Resolves silently if validation passes
 * @throws Error With status 402 (subscription expired) or 429 (quota exceeded)
 */
export async function checkTokenUsage(userId: string): Promise<void> {
  const validationResult = await SubscriptionUsageService.isTokenUsageAllowed(userId);

  if (!validationResult) {
    throw new Error(SubscriptionErrorCode.USAGE_LIMIT_EXCEEDED);
  }

}


/**
 * Checks if user can access a specific AI model based on their subscription tier.
 * 
 * @param userId The authenticated user ID
 * @param modelId The AI model identifier to check access for
 * @returns Promise<ModelAccessResult> Object with allowed, tier, plan, modelId, and optional reason
 */
export async function checkModelAccess(userId: string, modelId: string): Promise<boolean> {
  try {
    const subscription = await SubscriptionService.getUserSubscriptionWithValidation(userId)

    // Check if subscription is active first
    if (!subscription.isActive) {
      throw new Error(SubscriptionErrorCode.SUBSCRIPTION_EXPIRED)
    }

    return isModelAvailableForTier(modelId, getTierFromPlan(subscription.plan))

  } catch (error) {
    logger.error('Error checking model access', error as Error, {
      userId,
      metadata: {modelId}
    });

    return false
  }
}