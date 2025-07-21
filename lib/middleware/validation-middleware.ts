import {auth} from "@clerk/nextjs/server";
import {logger} from "@/lib/logger";
import {ModelTier, SubscriptionPlan} from "@/types/subscription-types";
import {ApiSubscriptionErrorCode} from "@/types/enums";
import {getTierFromPlan, isModelAvailableForTier} from "@/lib/ai/models-config";
import {getUserSubscription, isSubscriptionActive} from "@/lib/subscription/subscription-utils";
import {getTokenUsageLimit} from "@/lib/subscription/subscription-usage";
import {prisma} from "@/lib/prisma";

/**
 * Simple authentication middleware - returns userId or throws error
 */
export async function withAuth(): Promise<string> {
  const {userId} = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

/**
 * Client access validation middleware - checks if user owns the client
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
 * Token usage validation middleware - checks monthly token limits
 */
export async function withTokenValidation(userId: string): Promise<void> {
  const tokenUsage = await getTokenUsageLimit(userId)

  if (!tokenUsage.allowed) {
    const error = new Error(
        tokenUsage.reason === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
          ? 'Your subscription has expired. Please upgrade to continue using AI features.'
          : `You've reached your monthly token limit of ${tokenUsage.limit.toLocaleString()} tokens. You've used ${tokenUsage.used.toLocaleString()} tokens this month. Upgrade your plan to continue.`
      )

      // Add metadata to error for proper response handling
    ;(error as any).code = tokenUsage.reason || ApiSubscriptionErrorCode.USAGE_LIMIT_EXCEEDED
    ;(error as any).status = tokenUsage.reason === ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED ? 402 : 429
    ;(error as any).metadata = {
      limitType: 'tokens',
      used: tokenUsage.used,
      limit: tokenUsage.limit,
      remaining: tokenUsage.remaining,
      upgradeUrl: '/subscription'
    }
    throw error
  }

}

// Check if user can access a specific model based on their subscription
export async function checkModelAccess(userId: string, modelId: string) {
  const endTiming = logger.startTiming('Check Model Access', {userId});

  try {
    const subscription = await getUserSubscription(userId)

    // Check if subscription is active first
    if (!isSubscriptionActive(subscription)) {
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
        reason: ApiSubscriptionErrorCode.SUBSCRIPTION_EXPIRED
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
    return {allowed: false, tier: ModelTier.BASIC, plan: SubscriptionPlan.BASIC, modelId}
  }
}