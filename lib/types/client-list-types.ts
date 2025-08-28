export interface UsageInfo {
  clients: {
    allowed: boolean
    limit: number | 'unlimited'
    used: number
    remaining?: number
  }
  [key: string]: any
}

// Import Client interface from Prisma
import type {Client} from '@prisma/client'

export type { Client } from '@prisma/client'
export { CLIENT_FIELD_LABELS } from './client-types'

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