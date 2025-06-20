'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, User, Wand2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DatePicker } from '@/components/ui/date-picker'
import { getClientDocuments } from '@/lib/document-actions'
import { DocumentCombobox } from '@/components/ui/document-combobox'
import { ClientCombobox } from '@/components/ui/client-combobox'

interface MeetingReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
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

export function MeetingReportDialog({ open, onOpenChange, clients, onDocumentCreated }: MeetingReportDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'form' | 'generating' | 'editing'>('form')
  const [formData, setFormData] = useState<MeetingFormData>({
    clientId: '',
    meetingDate: '',
    meetingTranscription: '',
    additionalInfo: '',
    formatDocumentId: '',
    documentName: ''
  })
  const [generatedReport, setGeneratedReport] = useState('')
  const [editedReport, setEditedReport] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clientDocuments, setClientDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

  const selectedClient = clients.find(client => client.id === formData.clientId)

  // Load client documents when client is selected
  useEffect(() => {
    const loadClientDocuments = async () => {
      if (formData.clientId) {
        setIsLoadingDocuments(true)
        try {
          const documents = await getClientDocuments(formData.clientId)
          setClientDocuments(documents)
        } catch (error) {
          console.error('Error loading client documents:', error)
          toast({
            title: 'Error',
            description: 'Failed to load client documents',
            variant: 'destructive'
          })
        } finally {
          setIsLoadingDocuments(false)
        }
      } else {
        setClientDocuments([])
        setFormData(prev => ({ ...prev, formatDocumentId: '' }))
      }
    }

    loadClientDocuments()
  }, [formData.clientId, toast])

  const handleGenerate = async () => {
    if (!formData.clientId || !formData.meetingDate || !formData.meetingTranscription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setStep('generating')

    try {
      const response = await fetch('/api/ai-services/generate-meeting-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, language: selectedClient?.documentsLanguage || 'english' })
      })

      if (!response.ok) {
        throw new Error('Failed to generate meeting report')
      }

      const data = await response.json()
      setGeneratedReport(data.report)
      setEditedReport(data.report)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const meetingDateFormatted = new Date(formData.meetingDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Meeting Report - ${meetingDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
      
      setStep('editing')
    } catch (error) {
      console.error('Error generating meeting report:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate meeting report. Please try again.',
        variant: 'destructive'
      })
      setStep('form')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!editedReport.trim()) {
      toast({
        title: 'Empty Content',
        description: 'Please provide report content before saving',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/ai-services/save-meeting-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          reportContent: editedReport,
          documentName: formData.documentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save meeting report')
      }

      const data = await response.json()
      
      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Meeting Report Saved 📝',
          description: (
            <div>
              <p>Meeting report has been saved successfully.</p>
              <button 
                onClick={() => onDocumentCreated(formData.clientId, data.documentId)}
                className="text-blue-600 hover:text-blue-800 underline font-medium mt-1 block"
              >
                📄 View Document
              </button>
            </div>
          ),
          duration: 10000,
        })
      } else {
        toast({
          title: 'Meeting Report Saved 📝',
          description: `Meeting report has been saved successfully. You can find it in the Clients page under ${selectedClient?.name}'s documents.`,
          duration: 8000,
        })
      }

      // Reset and close
      setStep('form')
      setFormData({ 
        clientId: '', 
        meetingDate: '', 
        meetingTranscription: '', 
        additionalInfo: '', 
        formatDocumentId: '', 
        documentName: '' 
      })
      setGeneratedReport('')
      setEditedReport('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving meeting report:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save meeting report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setFormData({ 
      clientId: '', 
      meetingDate: '', 
      meetingTranscription: '', 
      additionalInfo: '', 
      formatDocumentId: '', 
      documentName: '' 
    })
    setGeneratedReport('')
    setEditedReport('')
    onOpenChange(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Calendar className="h-5 w-5" />
            Meeting Report
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6 overflow-y-auto flex-1 px-1">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">Select Client *</Label>
              <ClientCombobox
                clients={clients}
                value={formData.clientId}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, clientId: value }))}
                placeholder="Choose a client"
                searchPlaceholder="Search clients..."
                emptyMessage="No clients found."
                required
              />
              
            </div>

            {/* Meeting Date */}
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Meeting Date *</Label>
              <DatePicker
                id="meetingDate"
                value={formData.meetingDate}
                onChange={(value: string) => setFormData(prev => ({ ...prev, meetingDate: value }))}
                placeholder="Select meeting date"
                required
              />
            </div>

            {/* Meeting Transcription */}
            <div className="space-y-2">
              <Label htmlFor="meetingTranscription">Meeting Transcription *</Label>
              <Textarea
                id="meetingTranscription"
                value={formData.meetingTranscription}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingTranscription: e.target.value }))}
                placeholder="Paste or type the meeting transcription here..."
                rows={8}
                className="resize-y min-h-[200px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide the full transcription or detailed notes from your meeting with the client.
              </p>
            </div>



            {/* Additional Information Field */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Context (optional)</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="e.g., Previous session notes, specific focus areas, follow-up actions from last meeting..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Provide any additional context that might help generate a more accurate and useful report.
              </p>
            </div>



            {/* Generate Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!formData.clientId || !formData.meetingDate || !formData.meetingTranscription.trim()}
                className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
              <div>
                <h3 className="text-lg font-medium">Generating Meeting Report</h3>
                <p className="text-muted-foreground">
                  Analyzing the transcription and creating actionable insights...
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'editing' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Document Name Input */}
            <div className="mb-4">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
                placeholder="Enter document name"
                className="mt-1"
              />
            </div>

            {/* Report Editor */}
            <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
              {/* Editor */}
              <div className="space-y-2">
                <Label htmlFor="editedReport">Edit Report</Label>
                <Textarea
                  id="editedReport"
                  value={editedReport}
                  onChange={(e) => setEditedReport(e.target.value)}
                  className="h-[400px] resize-none font-mono text-sm"
                  placeholder="Generated report will appear here..."
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="h-[400px] overflow-y-auto border rounded-md p-4 bg-background">
                  <ReactMarkdown>
                    {editedReport || 'Preview will appear here...'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('form')}>
                Back to Form
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !editedReport.trim() || !formData.documentName.trim()}
                  className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Save Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 