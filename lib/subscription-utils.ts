import { prisma } from './prisma'
import { logger, withTiming } from './logger'

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9,
    currency: 'EUR',
    maxClients: 3,
    maxDocumentsPerMonth: 20,
    maxTokensPerMonth: 100000,        // 100K tokens (~75 pages of text
    maxCostPerMonth: 2.00,            // $2 OpenAI spending limit
    features: {
      canAccessPremiumPrompts: false,
      canAccessTeamFeatures: false,
      canAccessPrioritySupport: false,
      canAccessCustomBranding: false,
    },
    description: 'Perfect for getting started with AI marketing assistance',
    features_list: [
      'First month FREE',
      '100K tokens (~75 pages of content)',
      '$2 OpenAI usage limit',
      '3 client profiles',
      '20 documents per month',
      'Unlimited custom prompts',
      'Basic AI services',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15,
    currency: 'EUR',
    maxClients: -1, // unlimited
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
      '2M tokens (~1,500 pages of content)',
      '$25 OpenAI usage limit',
      'Unlimited client profiles',
      'Unlimited custom prompts',
      '200 documents per month',
      'All AI services',
      'Premium prompt templates',
      'Priority email support'
    ]
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 39,
    currency: 'EUR',
    maxClients: -1, // unlimited
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

    // Create default basic subscription if none exists using upsert to prevent race conditions
    if (!subscription) {
      logger.info('Creating new user subscription', { userId, metadata: { plan: 'basic' } });
      
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
            plan: 'basic',
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            maxClients: SUBSCRIPTION_PLANS.basic.maxClients,
            maxDocumentsPerMonth: SUBSCRIPTION_PLANS.basic.maxDocumentsPerMonth,
            maxTokensPerMonth: SUBSCRIPTION_PLANS.basic.maxTokensPerMonth,
            maxCostPerMonth: SUBSCRIPTION_PLANS.basic.maxCostPerMonth,
            canAccessPremiumPrompts: SUBSCRIPTION_PLANS.basic.features.canAccessPremiumPrompts,
            canAccessTeamFeatures: SUBSCRIPTION_PLANS.basic.features.canAccessTeamFeatures,
            canAccessPrioritySupport: SUBSCRIPTION_PLANS.basic.features.canAccessPrioritySupport,
            canAccessCustomBranding: SUBSCRIPTION_PLANS.basic.features.canAccessCustomBranding,
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
            documentsGenerated: 0,
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

// Check usage limits for different actions
export async function checkUsageLimit(userId: string, action: 'document' | 'client') {
  const endTiming = logger.startTiming('Check Usage Limit', { userId });
  
  try {

    
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getCurrentMonthUsage(userId)
    ])
    


    const plan = SUBSCRIPTION_PLANS[subscription.plan as PlanId]

    switch (action) {
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

// Track usage by updating monthly usage only (no individual events)
export async function updateUsageTracking(
  userId: string,
  eventType: 'document_generation',
  metadata?: {
    tokensUsed?: number
    estimatedCost?: number
    [key: string]: any
  }
) {
  const endTiming = logger.startTiming('Update Usage Tracking', { userId });
  
  try {
    // Update monthly usage directly
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const updateData: any = {}
    
    switch (eventType) {
      case 'document_generation':
        updateData.documentsGenerated = { increment: 1 }
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
        documentsGenerated: eventType === 'document_generation' ? 1 : 0,
        tokensUsed: metadata?.tokensUsed || 0,
        estimatedCost: metadata?.estimatedCost || 0,
      },
      update: updateData
    })

    endTiming();
  } catch (error) {
    logger.error('Error updating usage tracking', error as Error, { 
      userId,
      metadata: { eventType }
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
export async function checkFeatureAccess(userId: string, feature: keyof typeof SUBSCRIPTION_PLANS.basic.features) {
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
        documents: subscription.maxDocumentsPerMonth,
        clients: subscription.maxClients,
        tokens: subscription.maxTokensPerMonth,
        cost: subscription.maxCostPerMonth,
      },
      usage: {
        documents: currentUsage.documentsGenerated,
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