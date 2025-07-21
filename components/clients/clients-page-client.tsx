'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ClientsList} from '@/components/clients/clients-list'
import {ClientForm} from '@/components/clients/client-form'
import {ClientDocuments} from '@/components/clients/client-documents'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {useClientManagement} from '@/hooks/client/use-client-management'

interface ClientsPageClientProps {
  clients: any[]
}

// No longer need to store usage info at component level

export function ClientsPageClient({ clients: initialClients }: ClientsPageClientProps) {
  const [clients] = useState(initialClients)
  const router = useRouter()
  
  const {
    // State
    selectedClient,
    
    // Dialog states
    isDialogOpen,
    isDocumentsOpen,
    editingClient,
    
    // Actions
    handleAddClient,
    handleEditClient,
    handleViewDocuments,
    setIsDialogOpen,
    setIsDocumentsOpen,
    refreshClients,
  } = useClientManagement()

  const handleSuccess = () => {
    setIsDialogOpen(false)
    refreshClients()
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
  }


  return (
    <>
      <ClientsList
        clients={clients}
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onRefresh={refreshClients}
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
            hideTitle={true}
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