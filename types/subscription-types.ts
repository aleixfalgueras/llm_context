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
  PRO = 'pro'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete'
}

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