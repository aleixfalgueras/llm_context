/**
 * Centralized subscription and tier type definitions
 * Use these enums instead of string literals throughout the codebase
 */
import {SubscriptionPlan, SubscriptionStatus, UserSubscription, BillingInterval} from "@prisma/client";

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
// Note: description and features_key contain database keys for dynamic text lookup
export const SUBSCRIPTION_PLAN_DETAIL = {
  [SubscriptionPlan.apprentice]: {
    id: SubscriptionPlan.apprentice,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.apprentice],
    price: 0,
    priceAnnual: 0,
    currency: 'EUR',
    isFree: true,
    spending_limit_usd: 0, // Free plan - no AI usage allowed
    commissionLimit: 100,
    description: 'subscription.plans.apprentice.description',
    features_key: 'subscription.plans.apprentice.features'
  },
  [SubscriptionPlan.knight]: {
    id: SubscriptionPlan.knight,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.knight],
    price: 50,
    priceAnnual: 480, // 50 * 12 * 0.8 (20% discount)
    currency: 'EUR',
    isFree: false,
    spending_limit_usd: 14.5, // 12.5€
    commissionLimit: 500,
    description: 'subscription.plans.knight.description',
    features_key: 'subscription.plans.knight.features'
  },
  [SubscriptionPlan.master]: {
    id: SubscriptionPlan.master,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.master],
    price: 200,
    priceAnnual: 1920, // 200 * 12 * 0.8 (20% discount)
    currency: 'EUR',
    isFree: false,
    spending_limit_usd: 58, // 50€
    commissionLimit: 5000,
    description: 'subscription.plans.master.description',
    features_key: 'subscription.plans.master.features'
  },
  [SubscriptionPlan.jedi]: {
    id: SubscriptionPlan.jedi,
    name: SUBSCRIPTION_PLAN_NAMES[SubscriptionPlan.jedi],
    price: 500,
    priceAnnual: 4800, // 500 * 12 * 0.8 (20% discount)
    currency: 'EUR',
    isFree: false,
    spending_limit_usd: 145, // 125€
    commissionLimit: 50000,
    description: 'subscription.plans.jedi.description',
    features_key: 'subscription.plans.jedi.features'
  }
} as const

// Helper function to calculate annual savings
export function getAnnualSavings(plan: SubscriptionPlan): number {
  const planDetail = SUBSCRIPTION_PLAN_DETAIL[plan];
  const monthlyTotal = planDetail.price * 12;
  return monthlyTotal - planDetail.priceAnnual;
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