export interface UsageInfo {
  clients: {
    allowed: boolean
    limit: number | 'unlimited'
    used: number
    remaining?: number
  }
  [key: string]: any
}

// Import Client interface from centralized types
import type { Client } from './client-types'
export type { Client } from './client-types'
export { CLIENT_FIELD_LABELS, CLIENT_FIELD_PLACEHOLDERS } from './client-types'

export interface LanguageInfo {
  value: string
  label: string
  flag: string
}

export interface ClientActionHandlers {
  onEditClient: (client: Client) => void
  onViewClient: (client: Client) => void
  onViewDocuments: (client: Client) => void
  onDeleteClient: (clientId: string, clientName: string) => void
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  startIndex: number
  endIndex: number
} 