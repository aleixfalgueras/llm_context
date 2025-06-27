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
  specifiContext1?: string
  specifiContext2?: string
  specifiContext3?: string
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
  specifiContext1?: string | null
  specifiContext2?: string | null
  specifiContext3?: string | null
}

export interface ClientFormData {
  name: string
  email?: string
  phone?: string
  country?: string
  generalContext?: string
  specifiContext1?: string
  specifiContext2?: string
  specifiContext3?: string
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
  specifiContext1: 'Specific Context 1',
  specifiContext2: 'Specific Context 2',
  specifiContext3: 'Specific Context 3',
  documentsLanguage: 'Documents Language'
} as const

export const CLIENT_FIELD_PLACEHOLDERS = {
  id: 'Client ID',
  name: 'Enter client name',
  email: 'Enter email address',
  phone: 'Enter phone number',
  country: 'Select country',
  generalContext: 'Add general context about this client...',
  specifiContext1: 'Add specific context 1...',
  specifiContext2: 'Add specific context 2...',
  specifiContext3: 'Add specific context 3...',
  documentsLanguage: 'Select language'
} as const

// =============================================================================
// CONTEXT FIELD MAPPINGS
// =============================================================================

export const CLIENT_CONTEXT_FIELDS = {
  country: 'country',
  general_context: 'generalContext',
  specific_context_1: 'specifiContext1',
  specific_context_2: 'specifiContext2',
  specific_context_3: 'specifiContext3'
} as const

export const CLIENT_CONTEXT_FIELD_LABELS = {
  country: CLIENT_FIELD_LABELS.country,
  general_context: CLIENT_FIELD_LABELS.generalContext,
  specific_context_1: CLIENT_FIELD_LABELS.specifiContext1,
  specific_context_2: CLIENT_FIELD_LABELS.specifiContext2,
  specific_context_3: CLIENT_FIELD_LABELS.specifiContext3
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
  specifiContext1: true,
  specifiContext2: true,
  specifiContext3: true,
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