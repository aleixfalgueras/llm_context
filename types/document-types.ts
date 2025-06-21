export const DOCUMENT_TYPES = {
  MEETING: 'meeting',
  CUSTOM_DOCUMENT: 'custom-document',
  MANUAL: 'manual',
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DOCUMENT_TYPES.MEETING]: 'Meeting Report',
  [DOCUMENT_TYPES.CUSTOM_DOCUMENT]: 'Custom Document',
  [DOCUMENT_TYPES.MANUAL]: 'Manual Document',
}

// All Document Types (for filtering and general use)
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  DOCUMENT_TYPES.MEETING,
  DOCUMENT_TYPES.CUSTOM_DOCUMENT,
  DOCUMENT_TYPES.MANUAL,
]

// Utility function to get display label for a document type
export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] || type
} 