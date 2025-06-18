'use client'

import { useState } from 'react'
import { ClientsList } from './clients-list'
import { ClientForm } from './client-form'
import { ClientDocuments } from './client-documents'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ClientsPageClientProps {
  clients: any[]
}

export function ClientsPageClient({ clients: initialClients }: ClientsPageClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)

  const handleAddClient = () => {
    setEditingClient(null)
    setIsDialogOpen(true)
  }

  const handleEditClient = (client: any) => {
    setEditingClient(client)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setEditingClient(null)
    // Refresh the page to get updated data
    window.location.reload()
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setEditingClient(null)
  }

  const handleRefresh = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const handleViewDocuments = (client: any) => {
    setSelectedClient(client)
    setIsDocumentsOpen(true)
  }

  return (
    <>
      <ClientsList
        clients={clients}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onRefresh={handleRefresh}
        onViewDocuments={handleViewDocuments}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {selectedClient && (
        <ClientDocuments
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          open={isDocumentsOpen}
          onOpenChange={setIsDocumentsOpen}
        />
      )}
    </>
  )
} 