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
import { Dumbbell, Loader2, RefreshCw, Save, Edit, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DatePicker } from '@/components/ui/date-picker'
import { getClientDocuments } from '@/lib/document-actions'
import { DocumentCombobox } from '@/components/ui/document-combobox'
import { ClientCombobox } from '@/components/ui/client-combobox'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { Badge } from '@/components/ui/badge'

interface WorkoutGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

interface WorkoutFormData {
  clientId: string
  startDate: string
  endDate: string
  workoutType: string
  fitnessLevel: string
  daysPerWeek: string
  sessionDuration: string
  equipment: string
  additionalInfo: string
  formatDocumentId: string
  documentName: string
  clientContext: ClientContextSelection
}

export function WorkoutGeneratorDialog({ open, onOpenChange, clients, onDocumentCreated }: WorkoutGeneratorDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<WorkoutFormData>({
    clientId: '',
    startDate: '',
    endDate: '',
    workoutType: '',
    fitnessLevel: '',
    daysPerWeek: '',
    sessionDuration: '',
    equipment: '',
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
      title: 'Generating Workout Plan 🏋️‍♂️',
      description: `Creating a personalized workout plan for ${selectedClient?.name}... This usually takes 15-30 seconds.`,
      duration: 5000,
    })

    try {
      const response = await fetch('/api/ai-services/generate-workout', {
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
        throw new Error('Failed to generate workout')
      }

      const data = await response.json()
      setGeneratedContent(data.workout)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const startDateFormatted = new Date(formData.startDate).toISOString().split('T')[0]
        const endDateFormatted = new Date(formData.endDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Workout ${startDateFormatted} to ${endDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
    } catch (error) {
      console.error('Error generating workout:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate workout plan. Please try again.',
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
        description: 'Please provide workout content before saving',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/ai-services/save-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          workoutContent: generatedContent,
          documentName: formData.documentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save workout')
      }

      const data = await response.json()
      
      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Workout Saved 🏋️‍♂️',
          description: (
            <div>
              <p>Workout plan has been saved successfully.</p>
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
          title: 'Workout Saved 🏋️‍♂️',
          description: `Workout plan has been saved successfully. You can find it in the Clients page under ${selectedClient?.name}'s documents.`,
          duration: 8000,
        })
      }

      // Reset form
      setFormData({ 
        clientId: '', 
        startDate: '', 
        endDate: '', 
        workoutType: '', 
        fitnessLevel: '', 
        daysPerWeek: '', 
        sessionDuration: '', 
        equipment: '', 
        additionalInfo: '', 
        formatDocumentId: '', 
        documentName: '', 
        clientContext: defaultClientContextSelections.fitness
      })
      setGeneratedContent('')
      setIsEditMode(false)
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error saving workout:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save workout plan. Please try again.',
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
      workoutType: '', 
      fitnessLevel: '', 
      daysPerWeek: '', 
      sessionDuration: '', 
      equipment: '', 
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
            <Dumbbell className="h-5 w-5 text-yellow-600" />
            Generate Workout Plan
          </DialogTitle>
          <DialogDescription>
            Design custom workout routines tailored to your client's fitness level and objectives.
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
                Choose which client information to include in the AI context for workout generation:
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

          {/* Workout Specifications */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Workout Specifications</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutType">Workout Type</Label>
                <Select value={formData.workoutType} onValueChange={(value) => setFormData(prev => ({ ...prev, workoutType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="flexibility">Flexibility/Yoga</SelectItem>
                    <SelectItem value="mixed">Mixed Training</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="functional">Functional Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fitnessLevel">Fitness Level</Label>
                <Select value={formData.fitnessLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daysPerWeek">Days per Week</Label>
                <Select value={formData.daysPerWeek} onValueChange={(value) => setFormData(prev => ({ ...prev, daysPerWeek: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="4">4 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="6">6 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration</Label>
                <Select value={formData.sessionDuration} onValueChange={(value) => setFormData(prev => ({ ...prev, sessionDuration: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="75">75 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label htmlFor="equipment">Available Equipment</Label>
            <Textarea
              id="equipment"
              value={formData.equipment}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
              placeholder="e.g., Dumbbells, barbell, resistance bands, gym access..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              List the equipment available to your client. Leave blank for bodyweight exercises.
            </p>
          </div>

          {/* Additional Information Field */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional information</Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              placeholder="e.g., Format guidelines, specific exercises to include/avoid, injury considerations..."
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Provide any additional context or requirements for this workout plan beyond the client's profile.
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
                Select an existing document to use as a format/structure example for the AI when generating the new workout plan.
                {clientDocuments.length > 0 && ` (${clientDocuments.length} documents available)`}
              </p>
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Generated Workout Plan
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
                    placeholder="Edit your workout plan content here..."
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
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Workout Plan
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
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
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Workout Plan
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Workout Plan
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Workout Plan
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