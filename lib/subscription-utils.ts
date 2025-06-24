import { prisma } from './prisma'
import { logger, withTiming } from './logger'

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    maxConversationsPerMonth: 50,
    maxClients: 3,
    maxPromptsPerUser: 10,
    maxDocumentsPerMonth: 20,
    maxTokensPerMonth: 100000,        // 100K tokens (~75 pages of text
    maxCostPerMonth: 2.00,            // $2 OpenAI spending limit
    features: {
      canAccessPremiumPrompts: false,
      canAccessTeamFeatures: false,
      canAccessPrioritySupport: false,
      canAccessCustomBranding: false,
    },
    description: 'Perfect for trying out AI marketing assistance',
    features_list: [
      '50 AI conversations per month',
      '100K tokens (~75 pages of content)',
      '$2 OpenAI usage limit',
      '3 client profiles',
      '10 custom prompts',
      '20 documents per month',
      'Basic AI services',
      'Community support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15,
    currency: 'EUR',
    maxConversationsPerMonth: 500,
    maxClients: -1, // unlimited
    maxPromptsPerUser: -1, // unlimited
    maxDocumentsPerMonth: 200,
    maxTokensPerMonth: 2000000,       // 2M tokens (~1,500 pages of text)
    maxCostPerMonth: 25.00,           // $25 OpenAI spending limit
    features: {
      canAccessPremiumPrompts: true,
      canAccessTeamFeatures: false,
      canAccessPrioritySupport: false,
      canAccessCustomBranding: false,
    },
    description: 'For marketing professionals scaling their business',
    features_list: [
      '500 AI conversations per month',
      '2M tokens (~1,500 pages of content)',
      '$25 OpenAI usage limit',
      'Unlimited client profiles',
      'Unlimited custom prompts',
      '200 documents per month',
      'All AI services',
      'Premium prompt templates',
      'Email support'
    ]
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 39,
    currency: 'EUR',
    maxConversationsPerMonth: -1, // unlimited
    maxClients: -1, // unlimited
    maxPromptsPerUser: -1, // unlimited
    maxDocumentsPerMonth: -1, // unlimited
    maxTokensPerMonth: -1,            // unlimited tokens
    maxCostPerMonth: -1,              // unlimited OpenAI spending
    features: {
      canAccessPremiumPrompts: true,
      canAccessTeamFeatures: true,
      canAccessPrioritySupport: true,
      canAccessCustomBranding: true,
    },
    description: 'For agencies and teams with advanced needs',
    features_list: [
      'Unlimited AI conversations',
      'Unlimited tokens & OpenAI usage',
      'Unlimited client profiles',
      'Unlimited custom prompts',
      'Unlimited documents',
      'All AI services',
      'Premium prompt templates',
      'Team collaboration features',
      'Priority support',
      'Custom branding',
      'API access'
    ]
  }
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

// Get or create user subscription
export async function getUserSubscription(userId: string) {
  const endTiming = logger.startTiming('Get User Subscription', { userId });
  
  try {
    logger.dbQuery('findUnique', 'userSubscription', { userId });
    
    let subscription = await prisma.userSubscription.findUnique({
      where: { userId }
    })

    // Create default free subscription if none exists using upsert to prevent race conditions
    if (!subscription) {
      logger.info('Creating new user subscription', { userId, metadata: { plan: 'free' } });
      
      const now = new Date()
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      logger.dbQuery('upsert', 'userSubscription', { userId });
      subscription = await withTiming(
        'Create user subscription',
        () => prisma.userSubscription.upsert({
          where: { userId },
          update: {}, // Don't update if exists
          create: {
            userId,
            plan: 'free',
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            maxConversationsPerMonth: SUBSCRIPTION_PLANS.free.maxConversationsPerMonth,
            maxClients: SUBSCRIPTION_PLANS.free.maxClients,
            maxPromptsPerUser: SUBSCRIPTION_PLANS.free.maxPromptsPerUser,
            maxDocumentsPerMonth: SUBSCRIPTION_PLANS.free.maxDocumentsPerMonth,
            maxTokensPerMonth: SUBSCRIPTION_PLANS.free.maxTokensPerMonth,
            maxCostPerMonth: SUBSCRIPTION_PLANS.free.maxCostPerMonth,
            canAccessPremiumPrompts: SUBSCRIPTION_PLANS.free.features.canAccessPremiumPrompts,
            canAccessTeamFeatures: SUBSCRIPTION_PLANS.free.features.canAccessTeamFeatures,
            canAccessPrioritySupport: SUBSCRIPTION_PLANS.free.features.canAccessPrioritySupport,
            canAccessCustomBranding: SUBSCRIPTION_PLANS.free.features.canAccessCustomBranding,
          }
        }),
        { userId },
        500 // Database operations should be fast - warn if >500ms
      );
      

    } else {

    }

    endTiming();
    return subscription
  } catch (error) {
    logger.error('Error getting user subscription', error as Error, { userId });
    endTiming();
    throw error
  }
}

// Get current month usage
export async function getCurrentMonthUsage(userId: string) {
  const endTiming = logger.startTiming('Get Current Month Usage', { userId });
  
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    logger.dbQuery('findUnique', 'userUsage', { userId });
    let usage = await prisma.userUsage.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month
        }
      }
    })

    // Create usage record if none exists for current month using upsert to prevent race conditions
    if (!usage) {
      logger.info('Creating new user usage record', { 
        userId,
        metadata: { year, month }
      });
      
      logger.dbQuery('upsert', 'userUsage', { userId });
      usage = await withTiming(
        'Create user usage record',
        () => prisma.userUsage.upsert({
          where: {
            userId_year_month: {
              userId,
              year,
              month
            }
          },
          update: {}, // Don't update if exists
          create: {
            userId,
            year,
            month,
            conversationsUsed: 0,
            documentsGenerated: 0,
            promptsUsed: 0,
            estimatedCost: 0,
            tokensUsed: 0,
          }
        }),
        { userId },
        500 // Database operations should be fast - warn if >500ms
      );
      

    } else {

    }

    endTiming();
    return usage
  } catch (error) {
    logger.error('Error getting current month usage', error as Error, { 
      userId,
      metadata: { year, month }
    });
    endTiming();
    throw error
  }
}

// Check if user can perform action based on their plan limits
export async function checkUsageLimit(userId: string, action: 'conversation' | 'document' | 'prompt' | 'client') {
  const endTiming = logger.startTiming('Check Usage Limit', { userId });
  
  try {

    
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ])
    


    const plan = SUBSCRIPTION_PLANS[subscription.plan as PlanId]

    switch (action) {
      case 'conversation':
        // Check conversation count limit
        const maxConversations = subscription.maxConversationsPerMonth
        if (maxConversations !== -1 && usage.conversationsUsed >= maxConversations) {
          return {
            allowed: false,
            limit: maxConversations,
            used: usage.conversationsUsed,
            remaining: 0,
            limitType: 'conversations'
          }
        }
        
        // Check token limit
        const maxTokens = subscription.maxTokensPerMonth
        if (maxTokens !== -1 && usage.tokensUsed >= maxTokens) {
          return {
            allowed: false,
            limit: maxTokens,
            used: usage.tokensUsed,
            remaining: 0,
            limitType: 'tokens'
          }
        }
        
        // Check cost limit
        const maxCost = subscription.maxCostPerMonth
        if (maxCost !== -1 && usage.estimatedCost >= maxCost) {
          return {
            allowed: false,
            limit: maxCost,
            used: usage.estimatedCost,
            remaining: 0,
            limitType: 'cost'
          }
        }
        
        // All limits passed
        return {
          allowed: true,
          limit: maxConversations === -1 ? 'unlimited' : maxConversations,
          used: usage.conversationsUsed,
          remaining: maxConversations === -1 ? 'unlimited' : maxConversations - usage.conversationsUsed,
          limitType: 'conversations',
          additionalUsage: {
            tokens: { used: usage.tokensUsed, limit: maxTokens, remaining: maxTokens === -1 ? 'unlimited' : maxTokens - usage.tokensUsed },
            cost: { used: usage.estimatedCost, limit: maxCost, remaining: maxCost === -1 ? 'unlimited' : maxCost - usage.estimatedCost }
          }
        }

      case 'document':
        // Check document count limit
        const maxDocuments = subscription.maxDocumentsPerMonth
        if (maxDocuments !== -1 && usage.documentsGenerated >= maxDocuments) {
          return {
            allowed: false,
            limit: maxDocuments,
            used: usage.documentsGenerated,
            remaining: 0,
            limitType: 'documents'
          }
        }
        
        // Check token limit (documents also consume tokens)
        const maxTokensDoc = subscription.maxTokensPerMonth
        if (maxTokensDoc !== -1 && usage.tokensUsed >= maxTokensDoc) {
          return {
            allowed: false,
            limit: maxTokensDoc,
            used: usage.tokensUsed,
            remaining: 0,
            limitType: 'tokens'
          }
        }
        
        // Check cost limit (documents also consume API costs)
        const maxCostDoc = subscription.maxCostPerMonth
        if (maxCostDoc !== -1 && usage.estimatedCost >= maxCostDoc) {
          return {
            allowed: false,
            limit: maxCostDoc,
            used: usage.estimatedCost,
            remaining: 0,
            limitType: 'cost'
          }
        }
        
        // All limits passed
        return {
          allowed: true,
          limit: maxDocuments === -1 ? 'unlimited' : maxDocuments,
          used: usage.documentsGenerated,
          remaining: maxDocuments === -1 ? 'unlimited' : maxDocuments - usage.documentsGenerated,
          limitType: 'documents',
          additionalUsage: {
            tokens: { used: usage.tokensUsed, limit: maxTokensDoc, remaining: maxTokensDoc === -1 ? 'unlimited' : maxTokensDoc - usage.tokensUsed },
            cost: { used: usage.estimatedCost, limit: maxCostDoc, remaining: maxCostDoc === -1 ? 'unlimited' : maxCostDoc - usage.estimatedCost }
          }
        }

      case 'client':
        const clientCount = await prisma.client.count({ where: { userId } })
        const maxClients = subscription.maxClients
        if (maxClients === -1) return { allowed: true, limit: 'unlimited', used: clientCount, limitType: 'clients' }
        return {
          allowed: clientCount < maxClients,
          limit: maxClients,
          used: clientCount,
          remaining: maxClients - clientCount,
          limitType: 'clients'
        }

      case 'prompt':
        const promptCount = await prisma.prompt.count({ where: { userId } })
        const maxPrompts = subscription.maxPromptsPerUser
        if (maxPrompts === -1) return { allowed: true, limit: 'unlimited', used: promptCount, limitType: 'prompts' }
        return {
          allowed: promptCount < maxPrompts,
          limit: maxPrompts,
          used: promptCount,
          remaining: maxPrompts - promptCount,
          limitType: 'prompts'
        }

      default:
        logger.warn('Unknown action type for usage limit check', { 
          userId,
          metadata: { action }
        });
        endTiming();
        return { allowed: false, limit: 0, used: 0 }
    }
  } catch (error) {
    logger.error('Error checking usage limit', error as Error, { 
      userId,
      metadata: { action }
    });
    endTiming();
    return { allowed: false, limit: 0, used: 0 }
  } finally {
    endTiming();
  }
}

// Track usage event
export async function trackUsageEvent(
  userId: string,
  eventType: 'conversation' | 'document_generation' | 'prompt_usage' | 'client_creation',
  resourceId?: string,
  metadata?: {
    tokensUsed?: number
    estimatedCost?: number
    model?: string
    [key: string]: any
  }
) {
  const endTiming = logger.startTiming('Track Usage Event', { userId });
  
  try {

    // Create usage event
    await prisma.usageEvent.create({
      data: {
        userId,
        eventType,
        resourceId,
        tokensUsed: metadata?.tokensUsed,
        estimatedCost: metadata?.estimatedCost,
        model: metadata?.model,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      }
    })

    // Update monthly usage
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const updateData: any = {}
    
    switch (eventType) {
      case 'conversation':
        updateData.conversationsUsed = { increment: 1 }
        break
      case 'document_generation':
        updateData.documentsGenerated = { increment: 1 }
        break
      case 'prompt_usage':
        updateData.promptsUsed = { increment: 1 }
        break
      case 'client_creation':
        updateData.clientsCreated = { increment: 1 }
        break
    }

    if (metadata?.tokensUsed) {
      updateData.tokensUsed = { increment: metadata.tokensUsed }
    }
    if (metadata?.estimatedCost) {
      updateData.estimatedCost = { increment: metadata.estimatedCost }
    }

    await prisma.userUsage.upsert({
      where: {
        userId_year_month: {
          userId,
          year,
          month
        }
      },
      create: {
        userId,
        year,
        month,
        conversationsUsed: eventType === 'conversation' ? 1 : 0,
        documentsGenerated: eventType === 'document_generation' ? 1 : 0,
        promptsUsed: eventType === 'prompt_usage' ? 1 : 0,
        tokensUsed: metadata?.tokensUsed || 0,
        estimatedCost: metadata?.estimatedCost || 0,
      },
      update: updateData
    })


    
    endTiming();
  } catch (error) {
    logger.error('Error tracking usage event', error as Error, { 
      userId,
      metadata: { eventType, resourceId }
    });
    endTiming();
    throw error
  }
}

// Calculate estimated cost for OpenAI usage
export function calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = {
    'gpt-4o': {
      input: 0.0025,  // $0.0025 per 1K input tokens
      output: 0.01    // $0.01 per 1K output tokens
    },
    'gpt-4o-mini': {
      input: 0.00015, // $0.00015 per 1K input tokens
      output: 0.0006  // $0.0006 per 1K output tokens
    }
  }

  const modelPricing = pricing[model as keyof typeof pricing] || pricing['gpt-4o-mini']
  
  return (inputTokens / 1000) * modelPricing.input + (outputTokens / 1000) * modelPricing.output
}

// Check if user has access to premium features
export async function checkFeatureAccess(userId: string, feature: keyof typeof SUBSCRIPTION_PLANS.free.features) {
  try {
    const subscription = await getUserSubscription(userId)
    const plan = SUBSCRIPTION_PLANS[subscription.plan as PlanId]
    
    return plan.features[feature]
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

// Get usage analytics for dashboard
export async function getUserUsageAnalytics(userId: string) {
  try {
    const [subscription, currentUsage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ])

    const plan = SUBSCRIPTION_PLANS[subscription.plan as PlanId]

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      limits: {
        conversations: subscription.maxConversationsPerMonth,
        documents: subscription.maxDocumentsPerMonth,
        clients: subscription.maxClients,
        prompts: subscription.maxPromptsPerUser,
        tokens: subscription.maxTokensPerMonth,
        cost: subscription.maxCostPerMonth,
      },
      usage: {
        conversations: currentUsage.conversationsUsed,
        documents: currentUsage.documentsGenerated,
        prompts: currentUsage.promptsUsed,
        estimatedCost: currentUsage.estimatedCost,
        tokensUsed: currentUsage.tokensUsed,
      },
      planDetails: plan
    }
  } catch (error) {
    console.error('Error getting usage analytics:', error)
    throw error
  }
} 