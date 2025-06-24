export interface Document {
  id: string
  documentName: string
  documentType: string
  documentPath: string
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientDocumentsProps {
  clientId: string
  clientName: string
  clientEmail?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToHighlight?: string | null
} 