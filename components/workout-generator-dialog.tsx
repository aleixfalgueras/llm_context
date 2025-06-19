'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Dumbbell, Loader2, User, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'

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
    includeClientGoals: true
  })
  const [generatedWorkout, setGeneratedWorkout] = useState('')
  const [editedWorkout, setEditedWorkout] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const selectedClient = clients.find(client => client.id === formData.clientId)

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
          workoutContent: editedWorkout
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
        includeClientGoals: true 
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
      includeClientGoals: true 
    })
    setGeneratedWorkout('')
    setEditedWorkout('')
    onOpenChange(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
              <Select value={formData.clientId} onValueChange={(value: string) => setFormData(prev => ({ ...prev, clientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{client.name}</span>
                        {client.email && <span className="text-sm text-muted-foreground">({client.email})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Preview */}
            {selectedClient && (
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-900 dark:text-blue-100">Selected Client Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="text-blue-700 dark:text-blue-300">
                    <strong>{selectedClient.name}</strong>
                    {selectedClient.email && ` (${selectedClient.email})`}
                  </div>
                  {selectedClient.dateOfBirth && (
                    <div className="text-blue-600 dark:text-blue-400">
                      Age: {Math.floor((new Date().getTime() - new Date(selectedClient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old
                    </div>
                  )}
                  {(selectedClient.height || selectedClient.weight) && (
                    <div className="text-blue-600 dark:text-blue-400">
                      {selectedClient.height && `Height: ${selectedClient.height}cm`}
                      {selectedClient.height && selectedClient.weight && ' • '}
                      {selectedClient.weight && `Weight: ${selectedClient.weight}kg`}
                    </div>
                  )}
                  {selectedClient.goals && (
                    <div className="text-blue-600 dark:text-blue-400">
                      <strong>Goals:</strong> {selectedClient.goals}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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

            {/* Include Client Goals */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeClientGoals"
                checked={formData.includeClientGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, includeClientGoals: e.target.checked }))}
              />
              <Label htmlFor="includeClientGoals" className="text-sm">
                Include client's goals in workout plan generation
              </Label>
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

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={!formData.clientId || !formData.startDate || !formData.endDate}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Workout Plan
            </Button>
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