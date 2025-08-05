/**
 * Business error codes used throughout the application.
 * These represent specific business scenarios and are displayed to users.
 */

export enum SubscriptionErrorCode {
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  NO_SUBSCRIPTION_FOUND = 'NO_SUBSCRIPTION_FOUND',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  STORAGE_LIMIT_EXCEEDED = 'STORAGE_LIMIT_EXCEEDED',
  MODEL_ACCESS_DENIED = 'MODEL_ACCESS_DENIED'
}