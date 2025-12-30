import {auth} from "@clerk/nextjs/server";
import {logger} from "@/lib/logger";
import {SubscriptionUsageService} from "@/services/subscription/subscription-usage-service";
import {SubscriptionService} from "@/services/subscription/subscription-service";
import {SubscriptionErrorCode} from "@/services/error-codes";
import {getTierFromPlan, isModelAvailableForTier} from "@/lib/utils/model-utils";
import {SubscriptionPlan} from "@prisma/client";

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
 * Validates user hasn't exceeded monthly spending limits before AI operations.
 * Also blocks free Apprentice users from AI features.
 *
 * @param userId The authenticated user ID
 * @returns Promise<void> Resolves silently if validation passes
 * @throws Error With AI_FEATURES_NOT_AVAILABLE for free users, or USAGE_LIMIT_EXCEEDED for quota exceeded
 */
export async function checkUsageLimit(userId: string): Promise<void> {
  // Get subscription to check plan and Stripe status
  const subscription = await SubscriptionService.getUserSubscriptionWithValidation(userId)

  // Block free Apprentice users from AI features
  if (subscription.plan === SubscriptionPlan.apprentice && !subscription.stripeSubscriptionId) {
    throw new Error(SubscriptionErrorCode.AI_FEATURES_NOT_AVAILABLE)
  }

  // Check usage limit for paid users
  const validationResult = await SubscriptionUsageService.isUsageAllowed(userId);

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