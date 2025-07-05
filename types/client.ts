/**
 * Centralized client types and constants
 * This file contains all client-related interfaces, types, and field definitions
 * to avoid duplication across the codebase.
 */

// =============================================================================
// CORE CLIENT INTERFACE
// =============================================================================

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  country?: string
  generalContext?: string
  specificContext1?: string
  specificContext2?: string
  specificContext3?: string
  documentsLanguage?: string
}

// =============================================================================
// PARTIAL CLIENT INTERFACES FOR SPECIFIC USE CASES
// =============================================================================

export interface ClientBasic {
  id: string
  name: string
  email?: string
}

export interface ClientWithContext {
  name?: string | null
  country?: string | null
  generalContext?: string | null
  specificContext1?: string | null
  specificContext2?: string | null
  specificContext3?: string | null
}

export interface ClientFormData {
  name: string
  email?: string
  phone?: string
  country?: string
  generalContext?: string
  specificContext1?: string
  specificContext2?: string
  specificContext3?: string
  documentsLanguage?: string
}

// =============================================================================
// FIELD DEFINITIONS AND LABELS
// =============================================================================

export const CLIENT_FIELD_LABELS = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  country: 'Country',
  generalContext: 'General Context',
  specificContext1: 'Specific Context 1',
  specificContext2: 'Specific Context 2',
  specificContext3: 'Specific Context 3',
  documentsLanguage: 'Documents Language'
} as const

export const CLIENT_FIELD_PLACEHOLDERS = {
  id: 'Client ID',
  name: 'Enter client name',
  email: 'Enter email address',
  phone: 'Enter phone number',
  country: 'Select country',
  generalContext: 'Add general context about this client...',
  specificContext1: 'Add specific context...',
  specificContext2: 'Add specific context...',
  specificContext3: 'Add specific context...',
  documentsLanguage: 'Select language'
} as const

// =============================================================================
// CONTEXT FIELD MAPPINGS
// =============================================================================

export const CLIENT_CONTEXT_FIELDS = {
  country: 'country',
  general_context: 'generalContext',
  specific_context_1: 'specificContext1',
  specific_context_2: 'specificContext2',
  specific_context_3: 'specificContext3'
} as const

export const CLIENT_CONTEXT_FIELD_LABELS = {
  country: CLIENT_FIELD_LABELS.country,
  general_context: CLIENT_FIELD_LABELS.generalContext,
  specific_context_1: CLIENT_FIELD_LABELS.specificContext1,
  specific_context_2: CLIENT_FIELD_LABELS.specificContext2,
  specific_context_3: CLIENT_FIELD_LABELS.specificContext3
} as const

// =============================================================================
// DATABASE FIELD SELECTIONS
// =============================================================================

export const CLIENT_SELECT_BASIC = {
  id: true,
  name: true,
  email: true
} as const

export const CLIENT_SELECT_DETAILED = {
  id: true,
  name: true,
  email: true,
  phone: true,
  country: true,
  generalContext: true,
  specificContext1: true,
  specificContext2: true,
  specificContext3: true,
  documentsLanguage: true
} as const

// =============================================================================
// TYPE UTILITIES
// =============================================================================

export type ClientFieldKey = keyof Client
export type ClientContextFieldKey = keyof typeof CLIENT_CONTEXT_FIELDS
export type ClientFieldLabel = typeof CLIENT_FIELD_LABELS[ClientFieldKey]

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isValidClientField(field: string): field is ClientFieldKey {
  return field in CLIENT_FIELD_LABELS
}

export function getClientFieldLabel(field: ClientFieldKey): string {
  return CLIENT_FIELD_LABELS[field]
}

export function getClientFieldPlaceholder(field: ClientFieldKey): string {
  return CLIENT_FIELD_PLACEHOLDERS[field]
} 