'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {ClientsList} from '@/components/clients/clients-list'
import {ClientForm} from '@/components/clients/client-form'
import {ClientDocuments} from '@/components/clients/client-documents'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {AlertTriangle} from 'lucide-react'
import {Button} from '@/components/ui/button'
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
    showLimitDialog,
    editingClient,
    limitMessage,
    
    // Actions
    handleAddClient,
    handleEditClient,
    handleViewDocuments,
    setIsDialogOpen,
    setIsDocumentsOpen,
    setShowLimitDialog,
    refreshClients,
  } = useClientManagement()

  const handleSuccess = () => {
    setIsDialogOpen(false)
    refreshClients()
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
  }

  const handleUpgrade = () => {
    setShowLimitDialog(false)
    router.push('/subscription')
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

      {/* Client Limit Alert Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Client Limit Reached
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Upgrade Required</AlertTitle>
            <AlertDescription>
              {limitMessage}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>
              Close
            </Button>
            <Button onClick={handleUpgrade}>
              Upgrade Plan
            </Button>
          </div>
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