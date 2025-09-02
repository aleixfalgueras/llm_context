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

// TODO: Merge with SUBSCRIPTION_PLAN_NAMES
export enum ModelTier {
  APPRENTICE = 'apprentice',
  KNIGHT = 'knight',
  MASTER = 'master',
  JEDI = 'jedi'
}

// Subscription Plans Configuration
// Note: description and features_list now contain translation keys, not actual text
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.apprentice]: {
    id: SubscriptionPlan.apprentice,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.apprentice],
    price: 20,
    currency: 'EUR',
    spending_limit_usd: 5.8, // 5€
    commissionLimit: 100,
    description: 'subscription.plans.apprentice.description',
    features_list: [
      'subscription.plans.apprentice.features.0',
      'subscription.plans.apprentice.features.1',
      'subscription.plans.apprentice.features.2',
      'subscription.plans.apprentice.features.3'
    ]
  },
  [SubscriptionPlan.knight]: {
    id: SubscriptionPlan.knight,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.knight],
    price: 50,
    currency: 'EUR',
    spending_limit_usd: 14.5, // 12.5€
    commissionLimit: 500,
    description: 'subscription.plans.knight.description',
    features_list: [
      'subscription.plans.knight.features.0',
      'subscription.plans.knight.features.1',
      'subscription.plans.knight.features.2',
      'subscription.plans.knight.features.3'
    ]
  },
  [SubscriptionPlan.master]: {
    id: SubscriptionPlan.master,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.master],
    price: 200,
    currency: 'EUR',
    spending_limit_usd: 58, // 50€
    commissionLimit: 5000,
    description: 'subscription.plans.master.description',
    features_list: [
      'subscription.plans.master.features.0',
      'subscription.plans.master.features.1',
      'subscription.plans.master.features.2',
      'subscription.plans.master.features.3',
      'subscription.plans.master.features.4',
      'subscription.plans.master.features.5'
    ]
  },
  [SubscriptionPlan.jedi]: {
    id: SubscriptionPlan.jedi,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.jedi],
    price: 500,
    currency: 'EUR',
    spending_limit_usd: 145, // 125€
    commissionLimit: 50000,
    description: 'subscription.plans.jedi.description',
    features_list: [
      'subscription.plans.jedi.features.0',
      'subscription.plans.jedi.features.1',
      'subscription.plans.jedi.features.2',
      'subscription.plans.jedi.features.3',
      'subscription.plans.jedi.features.4',
      'subscription.plans.jedi.features.5',
      'subscription.plans.jedi.features.6'
    ]
  }
} as const

export type SubscriptionWithValidation = UserSubscription & {
  isActive: boolean // Computed field: SubscriptionService.isSubscriptionActive()
}

export type SubscriptionWithUsage = UserSubscription & { currentUsage?: number }

// Type aliases for convenience (can be used where string types are still needed)
export type SubscriptionPlanType = `${SubscriptionPlan}`
export type ModelTierType = `${ModelTier}`
export type SubscriptionStatusType = `${SubscriptionStatus}`
export type PlanId = SubscriptionPlan