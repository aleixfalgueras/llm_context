'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Loader2, Wand2, Calendar, Upload, Edit, Eye, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MarkdownRenderer } from '@/components/global/markdown-renderer'
import { DatePicker } from '@/components/ui/date-picker'
import { ClientCombobox } from '@/components/ui/client-combobox'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai-errors'
import { getDefaultModel } from '@/lib/models-config'

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
  const [formData, setFormData] = useState<MeetingFormData>({
    clientId: '',
    meetingDate: '',
    meetingTranscription: '',
    additionalInfo: '',
    formatDocumentId: '',
    documentName: ''
  })
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const selectedClient = clients.find(client => client.id === formData.clientId)

  // Handle file upload for meeting transcription
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's a text file
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a text (.txt) file only.',
        variant: 'destructive'
      })
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 5MB.',
        variant: 'destructive'
      })
      return
    }

    setIsUploadingFile(true)

    try {
      const text = await file.text()
      setFormData(prev => ({ ...prev, meetingTranscription: text }))
    } catch (error) {
      console.error('Error reading file:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to read the file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploadingFile(false)
      // Reset the input so the same file can be uploaded again if needed
      event.target.value = ''
    }
  }


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

    // Show toast notification
    toast({
      title: `📝 Generating meeting report for ${selectedClient?.name}`,
      description: 'This usually takes 30-60 seconds...',
      duration: 5000,
    })

    try {
      const response = await fetch('/api/ai-services/generate-meeting-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...formData, 
          model: getDefaultModel()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        // Handle AI provider errors from API
        if (errorData?.error && errorData?.provider) {
          const aiError = new AIProviderError(
            errorData.error,
            errorData.provider,
            errorData.type || 'unknown',
            response.status,
            errorData.retryAfter
          )
          throw aiError
        }
        
        throw new Error(errorData?.error || 'Failed to generate meeting report')
      }

      const data = await response.json()
      setGeneratedContent(data.report)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const meetingDateFormatted = new Date(formData.meetingDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Meeting Report - ${meetingDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
    } catch (error) {
      console.error('Error generating meeting report:', error)
      
      // Handle AI provider errors with specific messages
      if (error instanceof AIProviderError) {
        const { title, description } = getAIErrorMessage(error)
        toast({
          title,
          description,
          variant: 'destructive',
          duration: error.type === 'rate_limit' ? 10000 : 8000, // Longer duration for rate limits
        })
      } else {
        // Generic error handling
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate meeting report. Please try again.'
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent.trim()) {
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
          reportContent: generatedContent,
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
      setFormData({ 
        clientId: '', 
        meetingDate: '', 
        meetingTranscription: '', 
        additionalInfo: '', 
        formatDocumentId: '', 
        documentName: '' 
      })
      setGeneratedContent('')
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
    setFormData({ 
      clientId: '', 
      meetingDate: '', 
      meetingTranscription: '', 
      additionalInfo: '', 
      formatDocumentId: '', 
      documentName: '' 
    })
    setGeneratedContent('')
    setIsEditMode(false)
    onOpenChange(false)
  }


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Calendar className="h-5 w-5" />
            Meeting Report
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive meeting reports from transcriptions with AI assistance
          </DialogDescription>
        </DialogHeader>

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
            <div className="flex items-center justify-between">
              <Label htmlFor="meetingTranscription">Meeting Transcription *</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="transcription-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('transcription-file-upload')?.click()}
                  disabled={isUploadingFile}
                  className="text-xs text-blue-600 dark:text-blue-400"
                >
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload .txt
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="meetingTranscription"
              value={formData.meetingTranscription}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingTranscription: e.target.value }))}
              placeholder="Paste or type the meeting transcription here, or use the upload button above to load from a .txt file..."
              rows={8}
              className="resize-y min-h-[200px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide the full transcription or detailed notes from your meeting with the client. You can also upload a .txt file using the button above.
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

          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Title</Label>
            <Input
              id="documentName"
              value={formData.documentName}
              onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
              placeholder="Enter document title (auto-filled if empty)"
            />
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                    <Calendar className="h-5 w-5" />
                    Generated Meeting Report
                  </CardTitle>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                    {selectedClient?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                    placeholder="Edit your meeting report here..."
                  />
                ) : (
                  <MarkdownRenderer content={generatedContent} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!generatedContent ? (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !formData.clientId || !formData.meetingDate || !formData.meetingTranscription.trim()}
              className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(!isEditMode)}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !generatedContent.trim() || !formData.documentName.trim()}
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
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 