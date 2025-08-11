export interface Document {
  id: string
  documentName: string
  documentType: string
  documentPath: string
  createdAt: Date
  updatedAt: Date
}

export interface ClientDocumentsProps {
  clientId: string
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToHighlight?: string | null
} 