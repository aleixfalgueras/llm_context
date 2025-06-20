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
  const [isExtractingMedicalHistory, setIsExtractingMedicalHistory] = useState(false)
  const [selectedMedicalFile, setSelectedMedicalFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<ClientData>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    dateOfBirth: client?.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
    height: client?.height || undefined,
    weight: client?.weight || undefined,
    country: client?.country || '',
    goals: client?.goals || '',
    medicalHistory: client?.medicalHistory || '',
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

  const handleMedicalFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      // Check file size (warn if over 25MB, reject if over 50MB)
      const fileSizeMB = file.size / (1024 * 1024)
      
      if (fileSizeMB > 50) {
        toast({
          title: 'File Too Large',
          description: `PDF file is ${fileSizeMB.toFixed(1)}MB. Maximum size is 50MB. Please compress or split the document.`,
          variant: 'destructive'
        })
        return
      }
      
      if (fileSizeMB > 25) {
        toast({
          title: 'Large File Detected',
          description: `PDF file is ${fileSizeMB.toFixed(1)}MB. Processing may take longer and content might be truncated if too long.`,
          duration: 8000,
        })
      }
      
      setSelectedMedicalFile(file)
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a PDF file',
        variant: 'destructive'
      })
    }
  }

  const handleExtractMedicalHistory = async () => {
    if (!selectedMedicalFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a medical history PDF file first',
        variant: 'destructive'
      })
      return
    }

    // Check if medical history field already has content
    if (formData.medicalHistory && formData.medicalHistory.trim()) {
      const confirmOverride = window.confirm(
        "⚠️ Warning: The Medical History field already contains information.\n\n" +
        "Extracting from PDF will REPLACE the existing content.\n\n" +
        "Do you want to continue and override the current medical history?"
      )
      
      if (!confirmOverride) {
        return // User cancelled, don't proceed
      }
    }

    setIsExtractingMedicalHistory(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', selectedMedicalFile)
      // For new clients, we don't need to pass clientId
      if (client?.id) {
        formDataToSend.append('clientId', client.id)
      }

      const response = await fetch('/api/ai-services/extract-medical-history', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Failed to extract medical history')
      }

      const data = await response.json()
      
      // Update the medical history field with the extracted summary
      setFormData(prev => ({
        ...prev,
        medicalHistory: data.summary
      }))

      // Show success message with processing info
      let description = 'Comprehensive medical history has been extracted and organized by sections. Please review and edit as needed.'
      
      if (data.processingInfo?.wasContentTruncated) {
        description += '\n\n⚠️ Note: Document was large and content was truncated. Only the first portion was processed.'
      }

      toast({
        title: 'Medical History Extracted 📋',
        description,
        duration: 8000,
      })

      // Clear the selected file
      setSelectedMedicalFile(null)
      
      // Reset the file input
      const fileInput = document.getElementById('medicalHistoryFile') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

    } catch (error) {
      console.error('Error extracting medical history:', error)
      toast({
        title: 'Extraction Failed',
        description: 'Failed to extract medical history. Please try again or enter manually.',
        variant: 'destructive'
      })
    } finally {
      setIsExtractingMedicalHistory(false)
    }
  }

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
      [field]: field === 'height' || field === 'weight' 
        ? value ? parseFloat(value) : undefined 
        : value
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
                      This language will be used when generating documents (diet plans, workout plans, reports) 
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
            <Label htmlFor="goals">Goals</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={handleChange('goals')}
              placeholder="Describe the client's goals..."
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <div className="flex items-center gap-2">
                <input
                  id="medicalHistoryFile"
                  type="file"
                  accept=".pdf"
                  onChange={handleMedicalFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('medicalHistoryFile')?.click()}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  disabled={isExtractingMedicalHistory}
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF
                </Button>
                {selectedMedicalFile && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExtractMedicalHistory}
                    disabled={isExtractingMedicalHistory}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isExtractingMedicalHistory ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Extract
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {selectedMedicalFile && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>{selectedMedicalFile.name} ({(selectedMedicalFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1 mb-2">
              <p className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <strong>PDF Extraction:</strong> AI extracts detailed medical history from PDF documents (up to 40 pages, 50MB max)
              </p>
              <p className="ml-4">
                • Captures diagnoses, medications, lab results, imaging findings, and assessments
              </p>
              <p className="ml-4">
                • All personal information is automatically removed for privacy
              </p>
            </div>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange('medicalHistory')}
              placeholder="Enter comprehensive medical history including diagnoses, medications, lab results, symptoms, and treatments manually - OR - upload a PDF above for AI-powered comprehensive extraction."
              rows={6}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
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