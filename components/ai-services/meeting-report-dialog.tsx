'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Calendar, Loader2, Upload} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
import {DatePicker} from '@/components/ui/date-picker'
import type {BaseAIServiceDialogConfig, ValidationResult} from './base-ai-service-dialog'
import {BaseAIServiceDialog} from './base-ai-service-dialog'
import type {Client} from '@prisma/client'
import {getDefaultModel} from '@/lib/models-config'
import {useTranslations} from '@/lib/translations/context'

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
  const t = useTranslations('aiServices')
  const { toast } = useToast()
  const [formData, setFormData] = useState<MeetingFormData>({
    clientId: '',
    meetingDate: new Date().toISOString().split('T')[0],
    meetingTranscription: '',
    additionalInfo: '',
    formatDocumentId: '',
    documentName: ''
  })
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // Reset form data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        clientId: '',
        meetingDate: new Date().toISOString().split('T')[0],
        meetingTranscription: '',
        additionalInfo: '',
        formatDocumentId: '',
        documentName: ''
      })
      setIsUploadingFile(false)
    }
  }, [open])

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
        title: t('meetingReport.fileUpload.invalidType'),
        description: t('meetingReport.fileUpload.invalidTypeDescription'),
        variant: 'destructive'
      })
      return
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: t('meetingReport.fileUpload.fileTooLarge'),
        description: t('meetingReport.fileUpload.fileTooLargeDescription'),
        variant: 'destructive'
      })
      return
    }

    setIsUploadingFile(true)
    try {
      const text = await file.text()
      updateFormData({ meetingTranscription: text })
    } catch (error) {
      toast({
        title: t('meetingReport.fileUpload.uploadFailed'),
        description: t('meetingReport.fileUpload.uploadFailedDescription'),
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
    title: t('meetingReport.title'),
    description: t('meetingReport.description'),
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
      reportContent: content,
      meetingDate: data.meetingDate,
      additionalInfo: data.additionalInfo
    }),
    
    validateGeneration: (data: MeetingFormData): ValidationResult => {
      if (!data.clientId) {
        return { isValid: false, message: t('meetingReport.validation.selectClient') }
      }
      if (!data.meetingDate) {
        return { isValid: false, message: t('meetingReport.validation.selectDate') }
      }
      if (!data.meetingTranscription.trim()) {
        return { isValid: false, message: t('meetingReport.validation.provideTranscription') }
      }
      return { isValid: true }
    },
    
    validateSave: (data: MeetingFormData, content: string): ValidationResult => {
      if (!content.trim()) {
        return { isValid: false, message: t('meetingReport.validation.generateContent') }
      }
      if (!data.documentName.trim()) {
        return { isValid: false, message: t('meetingReport.validation.documentName') }
      }
      return { isValid: true }
    },
    
    generateDefaultName: (data: MeetingFormData, client?: Client) => {
      if (client && data.meetingDate) {
        const meetingDateFormatted = new Date(data.meetingDate).toISOString().split('T')[0]
        return `${client.name} Meeting Report - ${meetingDateFormatted}`
      }
      return t('meetingReport.defaultNames.meetingReport')
    },
    
    getDocumentNameField: (data: MeetingFormData) => data.documentName,
    
    setDocumentNameField: (data: MeetingFormData, name: string) => ({
      ...data,
      documentName: name
    }),
    
    getSuccessMessage: (client?: Client) => 
      client ? t('meetingReport.success.generatingForClient', { clientName: client.name }) : t('meetingReport.success.generating')
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
        <Label htmlFor="meeting-date">{t('meetingReport.form.meetingDate')} *</Label>
        <DatePicker
          value={formData.meetingDate}
          onChange={(date: string) => {
            updateFormData({ meetingDate: date })
          }}
          placeholder={t('meetingReport.form.meetingDatePlaceholder')}
        />
      </div>

      {/* Meeting Transcription */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meeting-transcription">{t('meetingReport.form.transcription')} *</Label>
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
                      {t('meetingReport.fileUpload.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      {t('meetingReport.form.uploadFile')}
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
          placeholder={t('meetingReport.form.transcriptionPlaceholder')}
          className="min-h-[150px]"
        />
        <p className="text-sm text-muted-foreground">
          {t('meetingReport.form.transcriptionHelp')}
        </p>
      </div>

      {/* Additional Information */}
      <div className="space-y-2">
        <Label htmlFor="additional-info">{t('meetingReport.form.additionalInfo')} (Optional)</Label>
        <Textarea
          id="additional-info"
          value={formData.additionalInfo}
          onChange={(e) => updateFormData({ additionalInfo: e.target.value })}
          placeholder={t('meetingReport.form.additionalInfoPlaceholder')}
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