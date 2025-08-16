import { DocumentType } from '@prisma/client'

export type { DocumentType }

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.meeting]: 'Meeting Report',
  [DocumentType.custom_document]: 'Custom Document',
  [DocumentType.manual]: 'Manual Document',
  [DocumentType.chat]: 'Chat Export',
}

// All Document Types (for filtering and general use)  
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.meeting,
  DocumentType.custom_document,
  DocumentType.manual,
  DocumentType.chat,
]

// Utility function to get display label for a document type
export function getDocumentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type] || type
}