/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */

export enum SubscriptionPlan {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

export enum ModelTier {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete',
  UNPAID = 'unpaid'
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: 'Basic',
    price: 10,
    currency: 'EUR',
    maxClients: 3,
    maxTokensPerMonth: 5000000,        // 5M tokens - generous allowance with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 5M * $0.000175 = $0.875, leaving $10.845 profit (92.5% margin) [€10 = $11.72]
    description: 'Perfect for getting started',
    features_list: [
      '👥 3 client profiles',
      '💾 50 MB document storage',
      '🔤 5M tokens (~3,750 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 25,
    currency: 'EUR',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 15000000,       // 15M tokens - excellent value with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 15M * $0.000175 = $2.625, leaving $26.675 profit (91.0% margin) [€25 = $29.30]
    description: 'For marketing professionals scaling their business',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 200 MB document storage',
      '🔤 15M tokens (~11,250 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.BUSINESS]: {
    id: SubscriptionPlan.BUSINESS,
    name: 'Business',
    price: 50,
    currency: 'EUR',
    maxClients: -1, // unlimited
    maxTokensPerMonth: 40000000,       // 40M tokens - enterprise-level allowance
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 40M * $0.000175 = $7, leaving $51.60 profit (88.1% margin) [€50 = $58.60]
    description: 'For agencies and teams with advanced needs',
    features_list: [
      '👥 Unlimited client profiles',
      '💾 2 GB document storage',
      '🔤 40M tokens (~30,000 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  }
} as const

// Type aliases for convenience (can be used where string types are still needed)
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`

// Utility functions for type checking and conversion
export function isValidSubscriptionPlan(plan: string): plan is SubscriptionPlanType {
  return Object.values(SubscriptionPlan).includes(plan as SubscriptionPlan)
}

export function isValidModelTier(tier: string): tier is ModelTierType {
  return Object.values(ModelTier).includes(tier as ModelTier)
}

export function isValidSubscriptionStatus(status: string): status is SubscriptionStatusType {
  return Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)
}

