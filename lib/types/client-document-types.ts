export interface ClientDocumentsProps {
  clientId: string
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToHighlight?: string | null
} 