
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
  documentsLanguage: 'Select language',
  createdAt: 'Creation date',
  updatedAt: 'Last updated'
} as const

// =============================================================================
// CONTEXT FIELD MAPPINGS TODO: Delete that?
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
