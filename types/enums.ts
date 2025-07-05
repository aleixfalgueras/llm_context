/**
 * Centralized enum definitions for the LLM Context application
 * This file consolidates all repeated string literals into proper TypeScript enums
 * for better type safety, consistency, and maintainability.
 */

// =============================================================================
// REQUEST AND PROCESS STATUS
// =============================================================================

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ServiceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  COMING_SOON = 'coming_soon'
}

// =============================================================================
// FEEDBACK SYSTEM
// =============================================================================

export enum FeedbackType {
  FEATURE = 'feature',
  BUG = 'bug',
  COMPLAINT = 'complaint'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// =============================================================================
// CONSENT AND AUDIT
// =============================================================================

export enum ConsentAction {
  GRANTED = 'granted',
  WITHDRAWN = 'withdrawn',
  UPDATED = 'updated'
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  COOKIES_ANALYTICS = 'cookies_analytics',
  COOKIES_MARKETING = 'cookies_marketing',
  COOKIES_FUNCTIONAL = 'cookies_functional'
}

// =============================================================================
// UI AND COMPONENT VARIANTS
// =============================================================================

export enum ToastVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  SUCCESS = 'success'
}

export enum ButtonVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  LINK = 'link'
}

export enum BadgeVariant {
  DEFAULT = 'default',
  SECONDARY = 'secondary',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline'
}

export enum ViewMode {
  GRID = 'grid',
  TABLE = 'table',
  LIST = 'list'
}

// =============================================================================
// LOGGING
// =============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// =============================================================================
// LANGUAGES
// =============================================================================

export enum Language {
  ENGLISH = 'english',
  SPANISH = 'spanish',
  FRENCH = 'french',
  GERMAN = 'german',
  ITALIAN = 'italian',
  PORTUGUESE = 'portuguese',
  DUTCH = 'dutch',
  POLISH = 'polish',
  RUSSIAN = 'russian',
  CATALAN = 'catalan'
}

// Language display information
export const LANGUAGE_INFO: Record<Language, { label: string; flag: string }> = {
  [Language.ENGLISH]: { label: 'English', flag: '🇺🇸' },
  [Language.SPANISH]: { label: 'Spanish (Español)', flag: '🇪🇸' },
  [Language.FRENCH]: { label: 'French (Français)', flag: '🇫🇷' },
  [Language.GERMAN]: { label: 'German (Deutsch)', flag: '🇩🇪' },
  [Language.ITALIAN]: { label: 'Italian (Italiano)', flag: '🇮🇹' },
  [Language.PORTUGUESE]: { label: 'Portuguese (Português)', flag: '🇵🇹' },
  [Language.DUTCH]: { label: 'Dutch (Nederlands)', flag: '🇳🇱' },
  [Language.POLISH]: { label: 'Polish (Polski)', flag: '🇵🇱' },
  [Language.RUSSIAN]: { label: 'Russian (Русский)', flag: '🇷🇺' },
  [Language.CATALAN]: { label: 'Catalan (Català)', flag: '🏴󠁥󠁳󠁣󠁴󠁿' }
}

// Helper function to get language options for forms
export function getLanguageOptions() {
  return Object.entries(LANGUAGE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    flag: info.flag
  }))
}

// =============================================================================
// UTILITY TYPES FOR BACKWARDS COMPATIBILITY
// =============================================================================

export type RequestStatusType = `${RequestStatus}`
export type ServiceStatusType = `${ServiceStatus}`
export type FeedbackTypeType = `${FeedbackType}`
export type PriorityType = `${Priority}`
export type ConsentActionType = `${ConsentAction}`
export type ConsentTypeType = `${ConsentType}`
export type ToastVariantType = `${ToastVariant}`
export type ButtonVariantType = `${ButtonVariant}`
export type BadgeVariantType = `${BadgeVariant}`
export type ViewModeType = `${ViewMode}`
export type LogLevelType = `${LogLevel}`
export type LanguageType = `${Language}`

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isValidRequestStatus(status: string): status is RequestStatusType {
  return Object.values(RequestStatus).includes(status as RequestStatus)
}

export function isValidFeedbackType(type: string): type is FeedbackTypeType {
  return Object.values(FeedbackType).includes(type as FeedbackType)
}

export function isValidPriority(priority: string): priority is PriorityType {
  return Object.values(Priority).includes(priority as Priority)
}

export function isValidLanguage(language: string): language is LanguageType {
  return Object.values(Language).includes(language as Language)
}

// =============================================================================
// FEEDBACK HELPERS
// =============================================================================

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  [FeedbackType.FEATURE]: 'Feature Request',
  [FeedbackType.BUG]: 'Bug Report',
  [FeedbackType.COMPLAINT]: 'General Feedback'
}

export const FEEDBACK_TYPE_DESCRIPTIONS: Record<FeedbackType, string> = {
  [FeedbackType.FEATURE]: 'Suggest a new feature or improvement',
  [FeedbackType.BUG]: 'Report a problem or error',
  [FeedbackType.COMPLAINT]: 'Share your thoughts or concerns'
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Low Priority - Minor issue',
  [Priority.MEDIUM]: 'Medium Priority - Moderate impact',
  [Priority.HIGH]: 'High Priority - Major issue'
}

// =============================================================================
// ARRAYS FOR ITERATION (USEFUL FOR DROPDOWNS, ETC.)
// =============================================================================

export const REQUEST_STATUS_VALUES = Object.values(RequestStatus)
export const FEEDBACK_TYPE_VALUES = Object.values(FeedbackType)
export const PRIORITY_VALUES = Object.values(Priority)
export const LANGUAGE_VALUES = Object.values(Language)
export const CONSENT_TYPE_VALUES = Object.values(ConsentType)
export const CONSENT_ACTION_VALUES = Object.values(ConsentAction) 