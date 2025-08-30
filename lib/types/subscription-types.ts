/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */
import {SubscriptionPlan, SubscriptionStatus, UserSubscription} from "@prisma/client";

// Plan hierarchy for upgrade/downgrade detection
export const SUBSCRIPTION_PLAN_HIERARCHY = [SubscriptionPlan.apprentice, SubscriptionPlan.knight, SubscriptionPlan.master, SubscriptionPlan.jedi]

// Subscription Plan names constant
export const SUBSCRIPTION_PLAN_NAMES = {
  [SubscriptionPlan.apprentice]: 'Apprentice',
  [SubscriptionPlan.knight]: 'Knight',
  [SubscriptionPlan.master]: 'Master',
  [SubscriptionPlan.jedi]: 'Jedi'
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.apprentice]: {
    id: SubscriptionPlan.apprentice,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.apprentice],
    price: 20,
    currency: 'EUR',
    spending_limit_usd: 5.8, // 5€
    commissionLimit: 100,
    description: 'Perfect for individuals starting their journey',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education & Defi',
      '💎 Free Ruby Subscription Asset Dream & Co NFT Marketplace'
    ]
  },
  [SubscriptionPlan.knight]: {
    id: SubscriptionPlan.knight,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.knight],
    price: 50,
    currency: 'EUR',
    spending_limit_usd: 14.5, // 12.5€
    commissionLimit: 500,
    description: 'For SMEs and content creators',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education & Defi',
      '💎 Free Ruby Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)'
    ]
  },
  [SubscriptionPlan.master]: {
    id: SubscriptionPlan.master,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.master],
    price: 200,
    currency: 'EUR',
    spending_limit_usd: 58, // 50€
    commissionLimit: 5000,
    description: 'For startups and influencers scaling their impact',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
      '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
      '🎟️ 1 free entrance to XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)'
    ]
  },
  [SubscriptionPlan.jedi]: {
    id: SubscriptionPlan.jedi,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.jedi],
    price: 500,
    currency: 'EUR',
    spending_limit_usd: 145, // 125€
    commissionLimit: 50000,
    description: 'For corporate leaders and CEOs driving innovation',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
      '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
      '🎟️ 1 free entrance to XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)',
      '📞 60 minutes private call per month to discuss personal branding and business scaling'
    ]
  }
} as const

export enum ModelTier {
  APPRENTICE = 'apprentice',
  KNIGHT = 'knight',
  MASTER = 'master',
  JEDI = 'jedi'
}

export type SubscriptionWithValidation = UserSubscription & {
  isActive: boolean // Computed field: SubscriptionService.isSubscriptionActive()
}

export type SubscriptionWithUsage = UserSubscription & { currentUsage?: number }

// Type aliases for convenience (can be used where string types are still needed)
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`
export type PlanId = SubscriptionPlan