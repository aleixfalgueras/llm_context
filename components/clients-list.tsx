'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, User } from 'lucide-react'
import { deleteClient } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'

interface ClientsListProps {
  clients: any[]
  onEditClient: (client: any) => void
  onAddClient: () => void
  onRefresh: () => void
}

export function ClientsList({ clients, onEditClient, onAddClient, onRefresh }: ClientsListProps) {
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
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client information and health profiles
          </p>
        </div>
        <Button onClick={onAddClient} className="flex items-center gap-2">
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start by adding your first client to begin tracking their health journey'
              }
            </p>
            {!searchTerm && (
              <Button onClick={onAddClient} className="mt-4">
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
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
                      onClick={() => onEditClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id, client.name)}
                      disabled={isDeleting === client.id}
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

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <Badge variant="secondary">
                      {client._count?.clientNotes || 0}
                    </Badge>
                  </div>

                  {client.goals && (
                    <div className="mt-3 p-2 bg-muted rounded-sm">
                      <p className="text-xs text-muted-foreground mb-1">Goals:</p>
                      <p className="text-sm line-clamp-2">{client.goals}</p>
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