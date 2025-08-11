export const DOCUMENT_TYPES = {
  MEETING: 'meeting',
  CUSTOM_DOCUMENT: 'custom-document',
  MANUAL: 'manual',
  CHAT: 'chat',
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DOCUMENT_TYPES.MEETING]: 'Meeting Report',
  [DOCUMENT_TYPES.CUSTOM_DOCUMENT]: 'Custom Document',
  [DOCUMENT_TYPES.MANUAL]: 'Manual Document',
  [DOCUMENT_TYPES.CHAT]: 'Chat Export',
}

// All Document Types (for filtering and general use)  
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  DOCUMENT_TYPES.MEETING,
  DOCUMENT_TYPES.CUSTOM_DOCUMENT,
  DOCUMENT_TYPES.MANUAL,
  DOCUMENT_TYPES.CHAT,
]

// Utility function to get display label for a document type
export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] || type
}

// Simplified Document interface for combobox usage
export interface Document {
  id: string
  documentName: string
  documentType: string
  documentPath: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentBasic {
  id: string
  documentName: string
  documentType: string
}