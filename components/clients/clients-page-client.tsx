'use client'

import { useState } from 'react'
import { ClientsList } from '@/components/clients/clients-list'
import { ClientForm } from '@/components/clients/client-form'
import { ClientDocuments } from '@/components/clients/client-documents'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientsPageClientProps {
  clients: any[]
}

// No longer need to store usage info at component level

export function ClientsPageClient({ clients: initialClients }: ClientsPageClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
    // No pre-loading of usage info - check only when needed

  const handleAddClient = async () => {
    // Check usage limits only when user tries to add a client
    try {
      const response = await fetch('/api/subscription/usage-info')
      if (response.ok) {
        const usageInfo = await response.json()
        
        // Check client limits
        if (usageInfo?.clients && !usageInfo.clients.allowed) {
          const limit = usageInfo.clients.limit === 'unlimited' ? 'unlimited' : usageInfo.clients.limit
          setLimitMessage(`You've reached your client limit of ${limit}. Upgrade your plan to add more clients.`)
          setShowLimitDialog(true)
          return
        }
      } else {
        console.warn('Could not fetch usage info, proceeding with client creation')
      }
    } catch (error) {
      console.warn('Error fetching usage info, proceeding with client creation:', error)
    }
    
    // User can add clients (either allowed or couldn't check), proceed with normal flow
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
            <Button onClick={() => window.open('/pricing', '_blank')}>
              View Plans
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