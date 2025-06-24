export interface UsageInfo {
  clients: {
    allowed: boolean
    limit: number | 'unlimited'
    used: number
    remaining?: number
  }
  [key: string]: any
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  country?: string
  documentsLanguage?: string
}

export interface LanguageInfo {
  value: string
  label: string
  flag: string
}

export interface ClientActionHandlers {
  onEditClient: (client: Client) => void
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