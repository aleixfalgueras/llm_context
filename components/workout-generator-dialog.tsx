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
import { Calendar, Dumbbell, Loader2, User, Wand2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DatePicker } from '@/components/ui/date-picker'
import { getClientDocuments } from '@/lib/document-actions'
import { DocumentCombobox } from '@/components/ui/document-combobox'
import { ClientCombobox } from '@/components/ui/client-combobox'

interface WorkoutGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
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
  includeClientGoals: boolean
  formatDocumentId: string
  documentName: string
}

export function WorkoutGeneratorDialog({ open, onOpenChange, clients }: WorkoutGeneratorDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'form' | 'generating' | 'editing'>('form')
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
    includeClientGoals: true,
    formatDocumentId: '',
    documentName: ''
  })
  const [generatedWorkout, setGeneratedWorkout] = useState('')
  const [editedWorkout, setEditedWorkout] = useState('')
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
      const response = await fetch('/api/ai-services/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate workout')
      }

      const data = await response.json()
      setGeneratedWorkout(data.workout)
      setEditedWorkout(data.workout)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const startDateFormatted = new Date(formData.startDate).toISOString().split('T')[0]
        const endDateFormatted = new Date(formData.endDate).toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Workout ${startDateFormatted} to ${endDateFormatted}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
      
      setStep('editing')
    } catch (error) {
      console.error('Error generating workout:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate workout plan. Please try again.',
        variant: 'destructive'
      })
      setStep('form')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!editedWorkout.trim()) {
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
          workoutContent: editedWorkout,
          documentName: formData.documentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save workout')
      }

      const data = await response.json()
      
      toast({
        title: 'Workout Saved',
        description: `Workout plan has been saved successfully for ${selectedClient?.name}`,
      })

      // Reset and close
      setStep('form')
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
        includeClientGoals: true,
        formatDocumentId: '',
        documentName: ''
      })
      setGeneratedWorkout('')
      setEditedWorkout('')
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
    setStep('form')
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
      includeClientGoals: true,
      formatDocumentId: '',
      documentName: ''
    })
    setGeneratedWorkout('')
    setEditedWorkout('')
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
      <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Generate Workout Plan
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

            {/* Client Preview */}
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
                    {selectedClient.email && (
                      <div>
                        <span className="font-medium">Email:</span> {selectedClient.email}
                      </div>
                    )}
                  </div>
                  {selectedClient.goals && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Goals:</span>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{selectedClient.goals}</p>
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

            {/* Workout Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workoutType">Workout Type</Label>
                <Select value={formData.workoutType} onValueChange={(value: string) => setFormData(prev => ({ ...prev, workoutType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workout type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="crossfit">CrossFit</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="pilates">Pilates</SelectItem>
                    <SelectItem value="mixed">Mixed Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fitnessLevel">Fitness Level</Label>
                <Select value={formData.fitnessLevel} onValueChange={(value: string) => setFormData(prev => ({ ...prev, fitnessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fitness level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daysPerWeek">Days Per Week</Label>
                <Select value={formData.daysPerWeek} onValueChange={(value: string) => setFormData(prev => ({ ...prev, daysPerWeek: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days/week</SelectItem>
                    <SelectItem value="3">3 days/week</SelectItem>
                    <SelectItem value="4">4 days/week</SelectItem>
                    <SelectItem value="5">5 days/week</SelectItem>
                    <SelectItem value="6">6 days/week</SelectItem>
                    <SelectItem value="7">7 days/week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  placeholder="e.g. 60"
                  value={formData.sessionDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionDuration: e.target.value }))}
                />
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label htmlFor="equipment">Available Equipment</Label>
              <Textarea
                id="equipment"
                placeholder="List available equipment (e.g. dumbbells, barbell, resistance bands, etc.)"
                value={formData.equipment}
                onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any special considerations, injuries, preferences, or specific requirements..."
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Format Document Selection */}
            {formData.clientId && (
              <div className="space-y-2">
                <Label htmlFor="formatDocument">Format Example Document (optional)</Label>
                <DocumentCombobox
                  documents={clientDocuments}
                  value={formData.formatDocumentId}
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, formatDocumentId: value }))}
                  placeholder="Select a document to use as format example"
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

            {/* Include Client Goals */}
            <div className="space-y-2">
              <Checkbox
                id="includeClientGoals"
                checked={formData.includeClientGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, includeClientGoals: e.target.checked }))}
                label="Include client's goals in workout plan generation"
              />
              <p className="text-xs text-muted-foreground ml-6">
                Uncheck this if you want to generate a workout without being influenced by the client's existing goals.
              </p>
            </div>

            {/* Date Range Summary */}
            {formData.startDate && formData.endDate && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Workout plan duration: {formatDate(formData.startDate)} to {formatDate(formData.endDate)}
                      ({Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!formData.clientId || !formData.startDate || !formData.endDate}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Workout Plan
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="text-lg font-medium">Generating Workout Plan</h3>
              <p className="text-muted-foreground">Creating a personalized workout plan for {selectedClient?.name}...</p>
            </div>
          </div>
        )}

        {step === 'editing' && (
          <div className="flex flex-col flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Review & Edit Workout Plan</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('form')}>
                  Back to Form
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Workout Plan'
                  )}
                </Button>
              </div>
            </div>

            {/* Document Name Input */}
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) => setFormData(prev => ({ ...prev, documentName: e.target.value }))}
                placeholder="Enter document name"
                className="font-medium"
              />
              <p className="text-xs text-muted-foreground">
                This name will be used to save the document. You can edit it before saving.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Edit the generated workout plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea
                    value={editedWorkout}
                    onChange={(e) => setEditedWorkout(e.target.value)}
                    className="w-full h-full font-mono text-sm resize-none border-0 rounded-none p-4"
                    placeholder="Generated workout plan will appear here..."
                    style={{ minHeight: 'calc(100vh - 300px)' }}
                  />
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{editedWorkout}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 