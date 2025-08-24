/**
 * Shared interface for client context selection across AI services
 * Allows users to choose which client information to include in AI generation
 */
export interface ClientContextSelection {
  country: boolean
  generalContext: boolean
  specificContext1: boolean
  specificContext2: boolean
  specificContext3: boolean
}

export const DEFAULT_CLIENT_CONTEXT: ClientContextSelection = {
  country: true,
  generalContext: true,
  specificContext1: false,
  specificContext2: false,
  specificContext3: false,
}

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
  documentsLanguage: 'Documents Language',
  createdAt: 'Created At',
  updatedAt: 'Updated At'
} as const

export const CLIENT_CONTEXT_FIELDS = {
  country: CLIENT_FIELD_LABELS.country,
  generalContext: CLIENT_FIELD_LABELS.generalContext,
  specificContext1: CLIENT_FIELD_LABELS.specificContext1,
  specificContext2: CLIENT_FIELD_LABELS.specificContext2,
  specificContext3: CLIENT_FIELD_LABELS.specificContext3
} as const

export const CLIENT_CONTEXT_VARIABLES = {
  country: "country",
  generalContext: "general_context",
  specificContext1: "specific_context_1",
  specificContext2: "specific_context_2",
  specificContext3: "specific_context_3"
} as const
