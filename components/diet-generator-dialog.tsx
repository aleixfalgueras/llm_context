'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Loader2, RefreshCw, Save, Edit, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DatePicker } from '@/components/ui/date-picker'
import { getClientDocuments } from '@/lib/document-actions'
import { DocumentCombobox } from '@/components/ui/document-combobox'
import { ClientCombobox } from '@/components/ui/client-combobox'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { Badge } from '@/components/ui/badge'

interface DietGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

interface DietFormData {
  clientId: string
  startDate: string
  endDate: string
  dailyCalories: string
  proteinTarget: string
  additionalInfo: string
  formatDocumentId: string
  documentName: string
  clientContext: ClientContextSelection
}

export function DietGeneratorDialog({ open, onOpenChange, clients, onDocumentCreated }: DietGeneratorDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<DietFormData>({
    clientId: '',
    startDate: '',
    endDate: '',
    dailyCalories: '',
    proteinTarget: '',
    additionalInfo: '',
    formatDocumentId: '',
    documentName: '',
    clientContext: defaultClientContextSelections.fitness
  })
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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
    if (!formData.clientId || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: 'Invalid Date Range',
        description: 'End date must be after start date',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)

    // Show loading toast
    toast({
      title: 'Generating Diet Plan 🥙',
      description: `Creating a personalized diet plan for ${selectedClient?.name}... This usually takes 15-30 seconds.`,
      duration: 5000,
    })

    try {
      const response = await fetch('/api/ai-services/generate-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...formData, 
          language: selectedClient?.documentsLanguage || 'english',
          includeClientGoals: formData.clientContext.goals 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate diet')
      }

      const data = await response.json()
      setGeneratedContent(data.diet)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const startDateFormatted = new Date(formData.startDate).toISOString().split('T')[0]
        const endDateFormatted = new Date(formData.endDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Diet ${startDateFormatted} to ${endDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
    } catch (error) {
      console.error('Error generating diet:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate diet plan. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent.trim()) {
      toast({
        title: 'Empty Content',
        description: 'Please provide diet content before saving',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/ai-services/save-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          dietContent: generatedContent,
          documentName: formData.documentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save diet')
      }

      const data = await response.json()
      
      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Diet Saved 🥙',
          description: (
            <div>
              <p>Diet plan has been saved successfully.</p>
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
          title: 'Diet Saved 🥙',
          description: `Diet plan has been saved successfully. You can find it in the Clients page under ${selectedClient?.name}'s documents.`,
          duration: 8000,
        })
      }

      // Reset form
      setFormData({ 
        clientId: '', 
        startDate: '', 
        endDate: '', 
        dailyCalories: '', 
        proteinTarget: '', 
        additionalInfo: '', 
        formatDocumentId: '', 
        documentName: '', 
        clientContext: defaultClientContextSelections.fitness
      })
      setGeneratedContent('')
      setIsEditMode(false)
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error saving diet:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save diet plan. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setFormData({ 
      clientId: '', 
      startDate: '', 
      endDate: '', 
      dailyCalories: '', 
      proteinTarget: '', 
      additionalInfo: '', 
      formatDocumentId: '', 
      documentName: '', 
      clientContext: defaultClientContextSelections.fitness
    })
    setGeneratedContent('')
    setIsEditMode(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Generate Diet Plan
          </DialogTitle>
          <DialogDescription>
            Create personalized diet plans for your clients based on their goals, medical history, and preferences.
          </DialogDescription>
        </DialogHeader>



        <div className="space-y-6">
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

          {/* Client Context Selection */}
          {selectedClient && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Client Context Selection</Label>
              <p className="text-sm text-muted-foreground">
                Choose which client information to include in the AI context for diet generation:
              </p>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                {selectedClient?.dateOfBirth && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-age"
                      checked={formData.clientContext.age}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, age: e.target.checked }
                      }))}
                      label={`Age (${Math.floor((new Date().getTime() - new Date(selectedClient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years)`}
                    />
                  </div>
                )}
                {selectedClient?.height && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-height"
                      checked={formData.clientContext.height}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, height: e.target.checked }
                      }))}
                      label={`Height (${selectedClient.height}cm)`}
                    />
                  </div>
                )}
                {selectedClient?.weight && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-weight"
                      checked={formData.clientContext.weight}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, weight: e.target.checked }
                      }))}
                      label={`Weight (${selectedClient.weight}kg)`}
                    />
                  </div>
                )}
                {selectedClient?.country && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-country"
                      checked={formData.clientContext.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, country: e.target.checked }
                      }))}
                      label={`Country (${selectedClient.country})`}
                    />
                  </div>
                )}
                {selectedClient?.goals && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-goals"
                      checked={formData.clientContext.goals}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, goals: e.target.checked }
                      }))}
                      label="Goals"
                    />
                  </div>
                )}
                {selectedClient?.medicalHistory && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-medical"
                      checked={formData.clientContext.medicalHistory}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, medicalHistory: e.target.checked }
                      }))}
                      label="Medical History"
                    />
                  </div>
                )}
                {selectedClient?.notes && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-notes"
                      checked={formData.clientContext.notes}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        clientContext: { ...prev.clientContext, notes: e.target.checked }
                      }))}
                      label="General Notes"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    clientContext: defaultClientContextSelections.fitness
                  }))}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    clientContext: {
                      age: false,
                      height: false,
                      weight: false,
                      country: false,
                      goals: false,
                      medicalHistory: false,
                      notes: false
                    }
                  }))}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <DatePicker
                id="startDate"
                value={formData.startDate}
                onChange={(value: string) => setFormData(prev => ({ ...prev, startDate: value }))}
                placeholder="Select start date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <DatePicker
                id="endDate"
                value={formData.endDate}
                onChange={(value: string) => setFormData(prev => ({ ...prev, endDate: value }))}
                placeholder="Select end date"
                required
              />
            </div>
          </div>

          {/* Nutritional Targets */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Nutritional Targets</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyCalories">Daily Calories (kcal)</Label>
                <Input
                  id="dailyCalories"
                  type="number"
                  min="800"
                  max="5000"
                  step="50"
                  value={formData.dailyCalories || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyCalories: e.target.value }))}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g., 2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinTarget">Daily Protein (g)</Label>
                <Input
                  id="proteinTarget"
                  type="number"
                  min="20"
                  max="300"
                  step="5"
                  value={formData.proteinTarget || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, proteinTarget: e.target.value }))}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="e.g., 120"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to let the AI determine appropriate targets based on the client's profile and goals.
            </p>
          </div>

          {/* Additional Information Field */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional information</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="e.g., Format guidelines, dietary preferences, special requirements, upcoming events..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Provide any additional context or requirements for this diet plan beyond the client's profile.
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

          {/* Format Document Selection */}
          {formData.clientId && (
            <div className="space-y-2">
              <Label htmlFor="formatDocument">Format Example Document</Label>
              <DocumentCombobox
                documents={clientDocuments}
                value={formData.formatDocumentId}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, formatDocumentId: value }))}
                placeholder="Select a document to use as a formatting example"
                searchPlaceholder="Search documents..."
                emptyMessage="No documents found."
                loading={isLoadingDocuments}
              />
              <p className="text-xs text-muted-foreground">
                Select an existing document to use as a format/structure example for the AI when generating the new diet plan.
                {clientDocuments.length > 0 && ` (${clientDocuments.length} documents available)`}
              </p>
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generated Diet Plan
                  <Badge variant="outline" className="ml-auto">
                    {isEditMode ? 'Edit Mode' : 'Preview Mode'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="min-h-96 font-mono text-sm"
                    placeholder="Edit your diet plan content here..."
                  />
                ) : (
                  <div className="max-h-96 overflow-y-auto prose prose-sm max-w-none">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!generatedContent ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.clientId || !formData.startDate || !formData.endDate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Diet Plan
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="border-green-600 text-green-600 hover:bg-green-50"
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
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Diet Plan
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Diet Plan
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Diet Plan
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