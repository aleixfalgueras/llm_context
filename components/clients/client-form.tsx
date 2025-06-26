'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { createClient, updateClient, type ClientData } from '@/lib/client-actions'
import { useToast } from '@/hooks/use-toast'
import { capitalizeName } from '@/lib/utils'
import { Globe, HelpCircle, Upload, FileText, CheckCircle, Loader2, Shield } from 'lucide-react'

interface ClientFormProps {
  client?: any
  onSuccess?: () => void
  onCancel?: () => void
  hideTitle?: boolean
}

export function ClientForm({ client, onSuccess, onCancel, hideTitle }: ClientFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClientData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    country: client?.country || '',
    notes: client?.notes || '',
    documentsLanguage: client?.documentsLanguage || 'english'
  })

  // Available languages for document generation
  const languages = [
    { value: 'english', label: 'English', flag: '🇺🇸' },
    { value: 'spanish', label: 'Spanish (Español)', flag: '🇪🇸' },
    { value: 'french', label: 'French (Français)', flag: '🇫🇷' },
    { value: 'german', label: 'German (Deutsch)', flag: '🇩🇪' },
    { value: 'italian', label: 'Italian (Italiano)', flag: '🇮🇹' },
    { value: 'portuguese', label: 'Portuguese (Português)', flag: '🇵🇹' },
    { value: 'dutch', label: 'Dutch (Nederlands)', flag: '🇳🇱' },
    { value: 'polish', label: 'Polish (Polski)', flag: '🇵🇱' },
    { value: 'russian', label: 'Russian (Русский)', flag: '🇷🇺' },
    { value: 'catalan', label: 'Catalan (Català)', flag: '🏴󠁥󠁳󠁣󠁴󠁿' },
  ]



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Format the name before saving
      const formattedData = {
        ...formData,
        name: capitalizeName(formData.name)
      }

      if (client?.id) {
        await updateClient(client.id, formattedData)
        toast({
          title: 'Success',
          description: 'Client updated successfully',
        })
      } else {
        await createClient(formattedData)
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
      [field]: value
    }))
  }

  const handleSelectChange = (field: keyof ClientData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {!hideTitle && (
        <CardHeader>
          <CardTitle>
            {client?.id ? 'Edit Client' : 'Add New Client'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={hideTitle ? "mt-4" : ""}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-r-md">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Personal Information
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                This information is never shared with anyone and is kept strictly confidential.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-25 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
            </div>
          </div>

          {/* Other Client Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center h-5">
                <Label htmlFor="country">Country</Label>
              </div>
              <Input
                id="country"
                value={formData.country}
                onChange={handleChange('country')}
                placeholder="e.g., United States, Canada, UK"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 h-5">
                <Label htmlFor="documentsLanguage" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Documents Language
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      This language will be used when generating marketing content and reports 
                      in the AI Services page for this client.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={formData.documentsLanguage} 
                onValueChange={handleSelectChange('documentsLanguage')}
              >
                <SelectTrigger id="documentsLanguage">
                  <SelectValue placeholder="Select language for generated documents" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Any notes about the client..."
              rows={4}
            />
          </div>



          <div className="flex justify-end gap-3 pt-4">
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
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : (client?.id ? 'Update Client' : 'Create Client')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 