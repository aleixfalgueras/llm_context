'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createClient, updateClient, type ClientData } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'

interface ClientFormProps {
  client?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClientData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    dateOfBirth: client?.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
    height: client?.height || undefined,
    weight: client?.weight || undefined,
    goals: client?.goals || '',
    medicalHistory: client?.medicalHistory || '',
    notes: client?.notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (client?.id) {
        await updateClient(client.id, formData)
        toast({
          title: 'Success',
          description: 'Client updated successfully',
        })
      } else {
        await createClient(formData)
        toast({
          title: 'Success',
          description: 'Client created successfully',
        })
      }
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ClientData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      [field]: field === 'height' || field === 'weight' 
        ? value ? parseFloat(value) : undefined 
        : value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {client?.id ? 'Edit Client' : 'Add New Client'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                placeholder="Client's full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="client@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={formData.height || ''}
                onChange={handleChange('height')}
                placeholder="170.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={handleChange('weight')}
                placeholder="70.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Health & Fitness Goals</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={handleChange('goals')}
              placeholder="Describe the client's health and fitness goals..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Medical History</Label>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange('medicalHistory')}
              placeholder="Any relevant medical conditions, allergies, medications..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Any additional notes about the client..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : (client?.id ? 'Update Client' : 'Create Client')}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 