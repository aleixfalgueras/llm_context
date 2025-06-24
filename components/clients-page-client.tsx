'use client'

import { useState, useEffect } from 'react'
import { ClientsList } from './clients-list'
import { ClientForm } from './client-form'
import { ClientDocuments } from './client-documents'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientsPageClientProps {
  clients: any[]
}

interface UsageInfo {
  clients: {
    allowed: boolean
    limit: number | 'unlimited'
    used: number
    remaining: number | 'unlimited'
  }
  [key: string]: any
}

export function ClientsPageClient({ clients: initialClients }: ClientsPageClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)

  // Fetch usage info once on component mount
  useEffect(() => {
    const fetchUsageInfo = async () => {
      try {
        const response = await fetch('/api/subscription/usage-info')
        if (response.ok) {
          const data = await response.json()
          setUsageInfo(data)
        }
      } catch (error) {
        console.error('Error fetching usage info:', error)
      }
    }

    fetchUsageInfo()
  }, [])

  const handleAddClient = async () => {
    // Use cached usage info if available, otherwise fetch fresh
    let currentUsageInfo = usageInfo
    
    if (!currentUsageInfo) {
      try {
        const response = await fetch('/api/subscription/usage-info')
        if (response.ok) {
          currentUsageInfo = await response.json()
          setUsageInfo(currentUsageInfo)
        }
      } catch (error) {
        console.error('Error checking usage info:', error)
        // Proceed with dialog if API fails
        setEditingClient(null)
        setIsDialogOpen(true)
        return
      }
    }
    
    if (currentUsageInfo?.clients && !currentUsageInfo.clients.allowed) {
      // User is at limit, show dialog
      const limit = currentUsageInfo.clients.limit === 'unlimited' ? 'unlimited' : currentUsageInfo.clients.limit
      setLimitMessage(`You've reached your client limit of ${limit}. Upgrade your plan to add more clients.`)
      setShowLimitDialog(true)
      return
    }
    
    // User can add clients, proceed with normal flow
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
        usageInfo={usageInfo}
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
          clientEmail={selectedClient.email}
          open={isDocumentsOpen}
          onOpenChange={setIsDocumentsOpen}
        />
      )}
    </>
  )
} 