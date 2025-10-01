
export interface DealFormData {
  title?: string
  description?: string
  price?: string
  externalUrl?: string
  imageFile?: File | null
  validFrom?: Date | null
  validUntil?: Date | null
  isActive?: boolean
}

export interface DealListFilters {
  searchTerm?: string
  isActive?: boolean
  isApproved?: boolean
  includeInactive?: boolean
}