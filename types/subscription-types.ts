/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */
import {SubscriptionPlan, SubscriptionStatus} from "@prisma/client";

// Subscription Plan names constant
export const SUBSCRIPTION_PLAN_NAMES = {
  [SubscriptionPlan.basic]: 'Basic',
  [SubscriptionPlan.pro]: 'Pro',
  [SubscriptionPlan.business]: 'Business'
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.basic]: {
    id: SubscriptionPlan.basic,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.basic],
    price: 10,
    currency: 'EUR',
    tokenLimit: 5000000,        // 5M tokens - generous allowance with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 5M * $0.000175 = $0.875, leaving $10.845 profit (92.5% margin) [€10 = $11.72]
    description: 'Perfect for getting started',
    features_list: [
      '💾 50 MB document storage',
      '🔤 5M tokens (~3,750 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.pro]: {
    id: SubscriptionPlan.pro,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.pro],
    price: 25,
    currency: 'EUR',
    tokenLimit: 15000000,       // 15M tokens - excellent value with Gemini 2.0 Flash
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 15M * $0.000175 = $2.625, leaving $26.675 profit (91.0% margin) [€25 = $29.30]
    description: 'For marketing professionals scaling their business',
    features_list: [
      '💾 200 MB document storage',
      '🔤 15M tokens (~11,250 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  },
  [SubscriptionPlan.business]: {
    id: SubscriptionPlan.business,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.business],
    price: 50,
    currency: 'EUR',
    tokenLimit: 40000000,       // 40M tokens - enterprise-level allowance
    // Pricing calculation: Gemini 2.0 Flash = ~$0.000175/1K tokens (blended)
    // Max cost: 40M * $0.000175 = $7, leaving $51.60 profit (88.1% margin) [€50 = $58.60]
    description: 'For agencies and teams with advanced needs',
    features_list: [
      '💾 2 GB document storage',
      '🔤 40M tokens (~30,000 pages of content)',
      '🤖 Powered by Google Gemini 2.0 and Chat GPT 4.1'
    ]
  }
} as const

export enum ModelTier {
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business'
}

// Type aliases for convenience (can be used where string types are still needed)
// TODO: Check and probably remove that
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`
export type PlanId = SubscriptionPlan
