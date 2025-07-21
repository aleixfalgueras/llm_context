/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */

export enum SubscriptionPlan {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

// Subscription Plan names constant
export const SUBSCRIPTION_PLAN_NAMES = {
  [SubscriptionPlan.BASIC]: 'Basic',
  [SubscriptionPlan.PRO]: 'Pro',
  [SubscriptionPlan.BUSINESS]: 'Business'
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.BASIC]: {
    id: SubscriptionPlan.BASIC,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.BASIC],
    price: 10,
    currency: 'EUR',
    maxTokensPerMonth: 5000000,        // 5M tokens - generous allowance with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 5M * $0.000175 = $0.875, leaving $10.845 profit (92.5% margin) [€10 = $11.72]
    description: 'Perfect for getting started',
    features_list: [
      '👥 Client profiles',
      '💾 50 MB document storage',
      '🔤 5M tokens (~3,750 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.PRO],
    price: 25,
    currency: 'EUR',
    maxTokensPerMonth: 15000000,       // 15M tokens - excellent value with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 15M * $0.000175 = $2.625, leaving $26.675 profit (91.0% margin) [€25 = $29.30]
    description: 'For marketing professionals scaling their business',
    features_list: [
      '👥 Client profiles',
      '💾 200 MB document storage',
      '🔤 15M tokens (~11,250 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.BUSINESS]: {
    id: SubscriptionPlan.BUSINESS,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.BUSINESS],
    price: 50,
    currency: 'EUR',
    maxTokensPerMonth: 40000000,       // 40M tokens - enterprise-level allowance
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 40M * $0.000175 = $7, leaving $51.60 profit (88.1% margin) [€50 = $58.60]
    description: 'For agencies and teams with advanced needs',
    features_list: [
      '👥 Client profiles',
      '💾 2 GB document storage',
      '🔤 40M tokens (~30,000 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  }
} as const

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete',
  UNPAID = 'unpaid'
}

export enum ModelTier {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

// Type aliases for convenience (can be used where string types are still needed)
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`
