'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, FileText, Loader2, User, Wand2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DatePicker } from '@/components/ui/date-picker'
import { getClientDocuments } from '@/lib/document-actions'
import { DocumentCombobox } from '@/components/ui/document-combobox'
import { ClientCombobox } from '@/components/ui/client-combobox'

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
  includeClientGoals: boolean
  formatDocumentId: string
  documentName: string
}

export function DietGeneratorDialog({ open, onOpenChange, clients, onDocumentCreated }: DietGeneratorDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'form' | 'generating' | 'editing'>('form')
  const [formData, setFormData] = useState<DietFormData>({
    clientId: '',
    startDate: '',
    endDate: '',
    dailyCalories: '',
    proteinTarget: '',
    additionalInfo: '',
    includeClientGoals: true,
    formatDocumentId: '',
    documentName: ''
  })
  const [generatedDiet, setGeneratedDiet] = useState('')
  const [editedDiet, setEditedDiet] = useState('')
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
    setStep('generating')

    try {
      const response = await fetch('/api/ai-services/generate-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate diet')
      }

      const data = await response.json()
      setGeneratedDiet(data.diet)
      setEditedDiet(data.diet)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const startDateFormatted = new Date(formData.startDate).toISOString().split('T')[0]
        const endDateFormatted = new Date(formData.endDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Diet ${startDateFormatted} to ${endDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
      
      setStep('editing')
    } catch (error) {
      console.error('Error generating diet:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate diet plan. Please try again.',
        variant: 'destructive'
      })
      setStep('form')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!editedDiet.trim()) {
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
          dietContent: editedDiet,
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

      // Reset and close
      setStep('form')
      setFormData({ clientId: '', startDate: '', endDate: '', dailyCalories: '', proteinTarget: '', additionalInfo: '', includeClientGoals: true, formatDocumentId: '', documentName: '' })
      setGeneratedDiet('')
      setEditedDiet('')
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
    setStep('form')
    setFormData({ clientId: '', startDate: '', endDate: '', dailyCalories: '', proteinTarget: '', additionalInfo: '', includeClientGoals: true, formatDocumentId: '', documentName: '' })
    setGeneratedDiet('')
    setEditedDiet('')
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
          <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <FileText className="h-5 w-5" />
            Generate Diet Plan
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

            {/* Selected Client Preview */}
            {selectedClient && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-900 dark:text-blue-100">Selected Client Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedClient.name}
                    </div>
                    {selectedClient.dateOfBirth && (
                      <div>
                        <span className="font-medium">Age:</span> {Math.floor((new Date().getTime() - new Date(selectedClient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                      </div>
                    )}
                    {selectedClient.height && (
                      <div>
                        <span className="font-medium">Height:</span> {selectedClient.height}cm
                      </div>
                    )}
                    {selectedClient.weight && (
                      <div>
                        <span className="font-medium">Weight:</span> {selectedClient.weight}kg
                      </div>
                    )}
                    {selectedClient.country && (
                      <div>
                        <span className="font-medium">Country:</span> {selectedClient.country}
                      </div>
                    )}
                  </div>
                  {selectedClient.goals && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Goals:</span>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedClient.goals}</p>
                    </div>
                  )}
                  {selectedClient.medicalHistory && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Medical History:</span>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedClient.medicalHistory}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
              <Label className="text-base font-medium">Nutritional Targets (Optional)</Label>
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
              <Label htmlFor="additionalInfo">Additional information (optional)</Label>
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

            {/* Format Document Selection */}
            {formData.clientId && (
              <div className="space-y-2">
                <Label htmlFor="formatDocument">Format Example Document (optional)</Label>
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

            {/* Include Client Goals Option */}
            <div className="space-y-2">
              <Checkbox
                id="includeClientGoals"
                checked={formData.includeClientGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, includeClientGoals: e.target.checked }))}
                label="Include client's goals in diet generation"
              />
              <p className="text-xs text-muted-foreground ml-6">
                Uncheck this if you want to generate a diet without being influenced by the client's existing goals.
              </p>
            </div>



            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!formData.clientId || !formData.startDate || !formData.endDate} className="bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Diet Plan
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 text-green-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Generating Diet Plan</h3>
              <p className="text-muted-foreground mb-4">Creating a personalized diet plan for {selectedClient?.name}...</p>
              
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-green-600 rounded-full animate-bounce"></div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                This usually takes 15-30 seconds
              </p>
            </div>
          </div>
        )}

        {step === 'editing' && (
          <div className="flex flex-col flex-1 space-y-4 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-medium">Review & Edit Diet Plan</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')}>
                  Back to Form
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Diet Plan'
                  )}
                </Button>
              </div>
            </div>

            {/* Document Name Input */}
            <div className="space-y-2 flex-shrink-0">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
                placeholder="Enter document name"
                className="font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Edit Panel */}
              <div className="border rounded-lg flex flex-col min-h-0">
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <h4 className="text-sm font-medium text-muted-foreground">Edit the generated diet plan</h4>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <Textarea
                    value={editedDiet}
                    onChange={(e) => setEditedDiet(e.target.value)}
                    className="w-full h-full font-mono text-sm resize-none border-0 p-4"
                    placeholder="Generated diet plan will appear here..."
                  />
                </div>
              </div>

              {/* Preview Panel */}
              <div className="border rounded-lg flex flex-col min-h-0">
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <h4 className="text-sm font-medium text-muted-foreground">Preview</h4>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{editedDiet}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 