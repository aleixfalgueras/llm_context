'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Search, Plus, Edit, Trash2, User, FileText } from 'lucide-react'
import { deleteClient } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'

interface ClientsListProps {
  clients: any[]
  onEditClient: (client: any) => void
  onAddClient: () => void
  onRefresh: () => void
  onViewDocuments: (client: any) => void
}

export function ClientsList({ clients, onEditClient, onAddClient, onRefresh, onViewDocuments }: ClientsListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(clientId)
    try {
      await deleteClient(clientId)
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      })
      onRefresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete client',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">Clients</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your client profiles and track their health journey
          </p>
        </div>
        <Button onClick={onAddClient} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search clients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by adding your first client to begin tracking their health journey'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onAddClient} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.email && (
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDocuments(client)}
                      title="View Documents"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClient(client)}
                      title="Edit Client"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id, client.name)}
                      disabled={isDeleting === client.id}
                      title="Delete Client"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {client.dateOfBirth && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Age:</span>
                      <span>{calculateAge(client.dateOfBirth)} years</span>
                    </div>
                  )}
                  
                  {(client.height || client.weight) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stats:</span>
                      <span>
                        {client.height && `${client.height}cm`}
                        {client.height && client.weight && ' • '}
                        {client.weight && `${client.weight}kg`}
                      </span>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}

                  {client.country && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Country:</span>
                      <span>{client.country}</span>
                    </div>
                  )}

                  {client.goals && (
                    <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-md">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Goals:</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 line-clamp-2">{client.goals}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 