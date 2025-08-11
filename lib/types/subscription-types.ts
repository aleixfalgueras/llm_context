/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */
import {SubscriptionPlan, SubscriptionStatus, UserSubscription} from "@prisma/client";

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
    tokenLimit: 15000000,
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
    tokenLimit: 15000000,
    description: 'For SMEs and content creators building their presence',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education & Defi',
      '💎 Free Ruby Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
      '🚀 Eligible Affiliate Starter Program'
    ]
  },
  [SubscriptionPlan.master]: {
    id: SubscriptionPlan.master,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.master],
    price: 200,
    currency: 'EUR',
    tokenLimit: 15000000,
    description: 'For startups and influencers scaling their impact',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
      '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
      '🚀 Eligible Affiliate Starter Program',
      '🎟️ 1 free entrance to XYZ Forum & Snomad Fest Entrepreneur (Snomad Pass Ticket)'
    ]
  },
  [SubscriptionPlan.jedi]: {
    id: SubscriptionPlan.jedi,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.jedi],
    price: 500,
    currency: 'EUR',
    tokenLimit: 15000000,
    description: 'For corporate leaders and CEOs driving innovation',
    features_list: [
      '🤖 Access to MIA AI platform',
      '👥 Discount on access to local meetups about AI Education, Defi & Influencers',
      '💎 Free Emeraud Subscription Asset Dream & Co NFT Marketplace',
      '🎪 Discount Event (Bansko Nomad Fest, Paris Blockchain Week, XYZ Forum)',
      '🚀 Eligible Affiliate Starter Program',
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

export type SubscriptionWithValidation = UserSubscription & { isActive: boolean }

// Type aliases for convenience (can be used where string types are still needed)
// TODO: Check and probably remove that
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`
export type PlanId = SubscriptionPlan
