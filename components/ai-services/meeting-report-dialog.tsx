'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { BaseAIServiceDialog } from './base-ai-service-dialog'
import type { BaseAIServiceDialogConfig, ValidationResult } from './base-ai-service-dialog'
import type { Client } from '@/types/client'
import { getDefaultModel } from '@/lib/models-config'

interface MeetingReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

interface MeetingFormData {
  clientId: string
  meetingDate: string
  meetingTranscription: string
  additionalInfo: string
  formatDocumentId: string
  documentName: string
}

export function MeetingReportDialog({ 
  open, 
  onOpenChange, 
  clients, 
  onDocumentCreated 
}: MeetingReportDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<MeetingFormData>({
    clientId: '',
    meetingDate: '',
    meetingTranscription: '',
    additionalInfo: '',
    formatDocumentId: '',
    documentName: ''
  })
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // Get selected client
  const getSelectedClient = (data: MeetingFormData) => 
    clients.find(c => c.id === data.clientId)

  // Update form data helper
  const updateFormData = (updates: Partial<MeetingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['text/plain', 'application/txt', 'text/txt']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a .txt file',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      })
      return
    }

    setIsUploadingFile(true)
    try {
      const text = await file.text()
      updateFormData({ meetingTranscription: text })
      toast({
        title: 'File Uploaded',
        description: `${file.name} has been loaded successfully`
      })
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to read the file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploadingFile(false)
      // Reset the input
      event.target.value = ''
    }
  }

  // Configuration for the base dialog
  const config: BaseAIServiceDialogConfig<MeetingFormData> = {
    title: 'Generate Meeting Report',
    description: 'Transform your meeting notes into a professional report',
    icon: Calendar,
    themeColor: 'purple',
    
    generateEndpoint: '/api/ai-services/generate-meeting-report',
    saveEndpoint: '/api/ai-services/save-meeting-report',
    
    buildGeneratePayload: (data: MeetingFormData) => ({
      ...data,
      model: getDefaultModel()
    }),
    
    buildSavePayload: (data: MeetingFormData, content: string) => ({
      clientId: data.clientId,
      documentName: data.documentName,
      content,
      meetingDate: data.meetingDate,
      additionalInfo: data.additionalInfo
    }),
    
    validateGeneration: (data: MeetingFormData): ValidationResult => {
      if (!data.clientId) {
        return { isValid: false, message: 'Please select a client' }
      }
      if (!data.meetingDate) {
        return { isValid: false, message: 'Please select a meeting date' }
      }
      if (!data.meetingTranscription.trim()) {
        return { isValid: false, message: 'Please provide meeting transcription' }
      }
      return { isValid: true }
    },
    
    validateSave: (data: MeetingFormData, content: string): ValidationResult => {
      if (!content.trim()) {
        return { isValid: false, message: 'Please provide report content before saving' }
      }
      if (!data.documentName.trim()) {
        return { isValid: false, message: 'Please provide a document name' }
      }
      return { isValid: true }
    },
    
    generateDefaultName: (data: MeetingFormData, client?: Client) => {
      if (client && data.meetingDate) {
        const meetingDateFormatted = new Date(data.meetingDate).toISOString().split('T')[0]
        return `${client.name} Meeting Report - ${meetingDateFormatted}`
      }
      return 'Meeting Report'
    },
    
    getDocumentNameField: (data: MeetingFormData) => data.documentName,
    
    setDocumentNameField: (data: MeetingFormData, name: string) => ({
      ...data,
      documentName: name
    }),
    
    getSuccessMessage: (client?: Client) => 
      client ? `📝 Generating meeting report for ${client.name}` : 'Generating meeting report...'
  }

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    updateFormData({ clientId })
  }

  // Custom fields for meeting report
  const renderCustomFields = () => (
    <>
      {/* Meeting Date */}
      <div className="space-y-2">
        <Label htmlFor="meeting-date">Meeting Date *</Label>
        <DatePicker
          value={formData.meetingDate}
          onChange={(date: string) => {
            updateFormData({ meetingDate: date })
          }}
          placeholder="Select meeting date"
        />
      </div>

      {/* Meeting Transcription */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meeting-transcription">Meeting Transcription *</Label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploadingFile}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isUploadingFile}
                type="button"
                asChild
              >
                <span>
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Upload .txt
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
        <Textarea
          id="meeting-transcription"
          value={formData.meetingTranscription}
          onChange={(e) => updateFormData({ meetingTranscription: e.target.value })}
          placeholder="Paste your meeting transcription here, or upload a .txt file..."
          className="min-h-[150px]"
        />
        <p className="text-sm text-muted-foreground">
          Provide the raw meeting notes or transcription. This will be transformed into a professional report.
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-2">
        <Label htmlFor="additional-info">Additional Context (Optional)</Label>
        <Textarea
          id="additional-info"
          value={formData.additionalInfo}
          onChange={(e) => updateFormData({ additionalInfo: e.target.value })}
          placeholder="Any additional context or specific requirements for the report..."
          className="min-h-[80px]"
        />
      </div>
    </>
  )

  return (
    <BaseAIServiceDialog
      open={open}
      onOpenChange={onOpenChange}
      clients={clients}
      onDocumentCreated={onDocumentCreated}
      config={config}
      formData={formData}
      onFormDataChange={setFormData}
      getSelectedClient={getSelectedClient}
      onClientChange={handleClientChange}
      renderCustomFields={renderCustomFields}
    />
  )
}