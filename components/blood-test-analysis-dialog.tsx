'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Upload, CheckCircle, AlertCircle, AlertTriangle, FileText, User, Calendar, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DateInput } from '@/components/ui/date-input'
import { ClientCombobox } from '@/components/ui/client-combobox'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'

interface BloodTestAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

export function BloodTestAnalysisDialog({ open, onOpenChange, clients, onDocumentCreated }: BloodTestAnalysisDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'extracting' | 'reviewing' | 'generating' | 'editing'>('upload')
  const [formData, setFormData] = useState({
    clientId: '',
    testDate: '',
    additionalInfo: '',
    documentName: '',
    clientContext: defaultClientContextSelections.medical
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [generatedReport, setGeneratedReport] = useState('')
  const [editedReport, setEditedReport] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedClient = clients.find(client => client.id === formData.clientId)

  // Helper function to calculate parameter status based on value and reference ranges
  const calculateParameterStatus = (value: string, referenceMin: string, referenceMax: string): string | null => {
    if (!value || !referenceMin || !referenceMax) {
      return null
    }
    
    // Handle both comma and dot decimal separators
    const parseNumeric = (str: string): number => {
      // Replace comma with dot for decimal separator, then remove any non-numeric characters except dots and minus
      const normalized = str.toString().replace(',', '.').replace(/[^\d.-]/g, '')
      return parseFloat(normalized)
    }
    
    const numValue = parseNumeric(value)
    const minRef = parseNumeric(referenceMin)
    const maxRef = parseNumeric(referenceMax)
    
    if (isNaN(numValue) || isNaN(minRef) || isNaN(maxRef)) {
      return null
    }
    
    if (numValue < minRef) {
      return 'low'
    } else if (numValue > maxRef) {
      return 'high'
    } else {
      return 'normal'
    }
  }

  // Helper function to update parameter and recalculate status
  const updateParameterWithStatusRecalc = (originalIndex: number, updates: any) => {
    const updatedParams = [...extractedData.parameters]
    const currentParam = updatedParams[originalIndex]
    const updatedParam = { ...currentParam, ...updates }
    
    // Recalculate status if value, referenceMin, or referenceMax changed (but not if status is being explicitly set)
    if (('value' in updates || 'referenceMin' in updates || 'referenceMax' in updates) && !('status' in updates)) {
      const newStatus = calculateParameterStatus(
        updatedParam.value,
        updatedParam.referenceMin,
        updatedParam.referenceMax
      )
      
      
      updatedParam.status = newStatus
    }
    
    updatedParams[originalIndex] = updatedParam
    setExtractedData({ ...extractedData, parameters: updatedParams })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a PDF file',
        variant: 'destructive'
      })
    }
  }

  const handleExtract = async () => {
    if (!selectedFile || !formData.clientId) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and client',
        variant: 'destructive'
      })
      return
    }

    setIsExtracting(true)
    setStep('extracting')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', selectedFile)
      formDataToSend.append('clientId', formData.clientId)
      if (formData.additionalInfo) {
        formDataToSend.append('additionalInfo', formData.additionalInfo)
      }

      const response = await fetch('/api/ai-services/extract-blood-test', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Failed to extract blood test data')
      }

      const data = await response.json()
      setExtractedData(data.extractedData)
      setStep('reviewing')
    } catch (error) {
      console.error('Error extracting blood test:', error)
      toast({
        title: 'Extraction Failed',
        description: 'Failed to extract blood test data. Please try again.',
        variant: 'destructive'
      })
      setStep('upload')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setStep('generating')

    try {
      const response = await fetch('/api/ai-services/generate-blood-test-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          testDate: extractedData.testInfo?.testDate,
          additionalInfo: formData.additionalInfo,
          extractedData,
          clientContext: formData.clientContext,
          language: selectedClient?.documentsLanguage || 'english'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      setGeneratedReport(data.report)
      setEditedReport(data.report)
      
      // Set default document name if not already set
      if (!formData.documentName) {
        const testDate = extractedData.testInfo?.testDate || formData.testDate || new Date().toISOString().split('T')[0]
        const defaultName = `${selectedClient?.name} Blood Test Analysis ${testDate}`
        setFormData(prev => ({ ...prev, documentName: defaultName }))
      }
      
      setStep('editing')
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate blood test report. Please try again.',
        variant: 'destructive'
      })
      setStep('reviewing')
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
      const response = await fetch('/api/ai-services/save-blood-test-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          testDate: extractedData.testInfo?.testDate,
          additionalInfo: formData.additionalInfo,
          extractedData,
          reportContent: editedReport,
          documentName: formData.documentName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save report')
      }

      const data = await response.json()
      
      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Report Saved 🧪',
          description: (
            <div>
              <p>Blood test analysis has been saved successfully.</p>
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
          title: 'Report Saved 🧪',
          description: `Blood test analysis has been saved successfully. You can find it in the Clients page under ${selectedClient?.name}'s documents.`,
          duration: 8000,
        })
      }

      // Reset and close
      handleClose()
    } catch (error) {
      console.error('Error saving report:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save blood test report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFormData({ clientId: '', testDate: '', additionalInfo: '', documentName: '', clientContext: defaultClientContextSelections.medical })
    setSelectedFile(null)
    setExtractedData(null)
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
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Activity className="h-5 w-5" />
            Blood Test Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6 overflow-y-auto flex-1 px-1">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Select Client *</Label>
                <ClientCombobox
                  clients={clients}
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
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
                    Choose which client information to include in the AI context for blood test analysis:
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
                        clientContext: defaultClientContextSelections.medical
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
                  <p className="text-xs text-muted-foreground">
                    Note: Goals are typically not included in blood test analysis to maintain medical objectivity.
                  </p>
                </div>
              )}

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload Blood Test PDF *</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choose PDF File
                  </Button>
                  {selectedFile && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ {selectedFile.name}
                    </span>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Extraction Help (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Provide additional format details if the extraction is not working well or the blood test does not follow the typical format [name, value, units, min reference, max reference]"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Use this field only if you have a non-standard blood test format that needs special extraction instructions
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleExtract} className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600">
                  Extract Data
                </Button>
              </div>
            </div>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                              <Upload className="h-16 w-16 text-red-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Extracting Blood Test Data</h3>
              <p className="text-muted-foreground mb-4">AI is analyzing your PDF and extracting parameters...</p>
              
              <div className="flex justify-center">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></div>
                </div>
              </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  This usually takes 30-60 seconds
                </p>
              </div>
            </div>
          )}

          {/* Reviewing Step */}
          {step === 'reviewing' && extractedData && (
            <div className="space-y-6 overflow-y-auto flex-1 px-1">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Data Extracted Successfully</h3>
                <p className="text-muted-foreground">Please review the extracted parameters below</p>
              </div>

              {/* Test Date Section */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Test Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="extractedTestDate">Test Date</Label>
                      <DateInput
                        id="extractedTestDate"
                        value={extractedData.testInfo?.testDate || ''}
                        onChange={(value) => setExtractedData({
                          ...extractedData,
                          testInfo: {
                            ...extractedData.testInfo,
                            testDate: value
                          }
                        })}
                        className="mt-1"
                      />
                    </div>
                    {extractedData.testInfo?.labName && (
                      <div>
                        <Label>Laboratory</Label>
                        <p className="mt-1 p-2 bg-muted rounded">{extractedData.testInfo.labName}</p>
                      </div>
                    )}
                    {extractedData.testInfo?.doctorName && (
                      <div>
                        <Label>Doctor</Label>
                        <p className="mt-1 p-2 bg-muted rounded">{extractedData.testInfo.doctorName}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Anomalous Parameters Alert */}
              {extractedData.parameters?.some((param: any) => param.status === 'high' || param.status === 'low') && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <AlertTriangle className="h-5 w-5" />
                      Anomalous Parameters Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {extractedData.parameters
                        ?.filter((param: any) => param.status === 'high' || param.status === 'low')
                        .map((param: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{param.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {param.value} {param.unit}
                              </span>
                              {param.referenceMin && param.referenceMax && (
                                <span className="text-xs text-muted-foreground">
                                  (Ref: {param.referenceMin}-{param.referenceMax})
                                </span>
                              )}
                            </div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              param.status === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            }`}>
                              {param.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Extracted Blood Test Parameters
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Review and edit the extracted parameters below</p>
                  
                  {/* Search Box */}
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search parameters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {(() => {
                        const filteredParams = extractedData.parameters
                          ?.filter((param: any) => {
                            if (!searchTerm) return true
                            return param.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   param.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   param.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   param.status?.toLowerCase().includes(searchTerm.toLowerCase())
                          })
                        
                        if (searchTerm && filteredParams?.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No parameters found matching "{searchTerm}"</p>
                              <p className="text-sm">Try searching for a different term</p>
                            </div>
                          )
                        }
                        
                        return filteredParams
                          ?.sort((a: any, b: any) => {
                            // Sort anomalous parameters (high/low) first, then normal
                            const aIsAnomalous = a.status === 'high' || a.status === 'low'
                            const bIsAnomalous = b.status === 'high' || b.status === 'low'
                            
                            if (aIsAnomalous && !bIsAnomalous) return -1
                            if (!aIsAnomalous && bIsAnomalous) return 1
                            
                            // Within same category, sort by status (high, low, normal)
                            if (aIsAnomalous && bIsAnomalous) {
                              if (a.status === 'high' && b.status === 'low') return -1
                              if (a.status === 'low' && b.status === 'high') return 1
                            }
                            
                            return 0
                          })
                          ?.map((param: any, displayIndex: number) => {
                            // Find the original index in the unfiltered array
                            const originalIndex = extractedData.parameters.findIndex((p: any) => p === param)
                            return (
                        <div key={originalIndex} className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Parameter Name</Label>
                              <Input
                                value={param.name || ''}
                                onChange={(e) => {
                                  const updatedParams = [...extractedData.parameters]
                                  updatedParams[originalIndex] = { ...updatedParams[originalIndex], name: e.target.value }
                                  setExtractedData({ ...extractedData, parameters: updatedParams })
                                }}
                                className="text-sm"
                                placeholder="Parameter name"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Value</Label>
                              <Input
                                value={param.value || ''}
                                onChange={(e) => {
                                  updateParameterWithStatusRecalc(originalIndex, { value: e.target.value })
                                }}
                                className="text-sm"
                                placeholder="Test value"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Unit</Label>
                              <Input
                                value={param.unit || ''}
                                onChange={(e) => {
                                  const updatedParams = [...extractedData.parameters]
                                  updatedParams[originalIndex] = { ...updatedParams[originalIndex], unit: e.target.value }
                                  setExtractedData({ ...extractedData, parameters: updatedParams })
                                }}
                                className="text-sm"
                                placeholder="Unit (e.g., mg/dL)"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Reference Min</Label>
                              <Input
                                value={param.referenceMin || ''}
                                onChange={(e) => {
                                  updateParameterWithStatusRecalc(originalIndex, { referenceMin: e.target.value })
                                }}
                                className="text-sm"
                                placeholder="Min reference"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Reference Max</Label>
                              <Input
                                value={param.referenceMax || ''}
                                onChange={(e) => {
                                  updateParameterWithStatusRecalc(originalIndex, { referenceMax: e.target.value })
                                }}
                                className="text-sm"
                                placeholder="Max reference"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Status</Label>
                                                             <Select
                                 value={param.status || 'unspecified'}
                                 onValueChange={(value) => {
                                   updateParameterWithStatusRecalc(originalIndex, { 
                                     status: value === 'unspecified' ? null : value 
                                   })
                                 }}
                               >
                                 <SelectTrigger className="text-sm">
                                   <SelectValue placeholder="Status" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="normal">Normal</SelectItem>
                                   <SelectItem value="high">High</SelectItem>
                                   <SelectItem value="low">Low</SelectItem>
                                   <SelectItem value="unspecified">Not specified</SelectItem>
                                 </SelectContent>
                               </Select>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div className="flex items-center gap-2">
                              {param.status && (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  param.status === 'normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                  param.status === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  param.status === 'low' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                  {param.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                                                             onClick={() => {
                                 const parameterName = param.name || 'Unnamed parameter'
                                 const updatedParams = extractedData.parameters.filter((_: any, i: number) => i !== originalIndex)
                                 setExtractedData({ ...extractedData, parameters: updatedParams })
                                 toast({
                                   title: 'Parameter Removed',
                                   description: `"${parameterName}" has been removed from the blood test analysis.`,
                                 })
                               }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                            )
                          })
                      })()}
                      
                      {/* Add New Parameter Button */}
                      <Button
                        variant="outline"
                                                 onClick={() => {
                           const newParam = {
                             name: '',
                             value: '',
                             unit: '',
                             referenceMin: '',
                             referenceMax: '',
                             status: null
                           }
                          setExtractedData({
                            ...extractedData,
                            parameters: [...(extractedData.parameters || []), newParam]
                          })
                        }}
                        className="w-full border-dashed"
                      >
                        + Add New Parameter
                      </Button>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button onClick={() => setStep('upload')} variant="outline">
                  Back
                </Button>
                <Button onClick={handleGenerate} className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600">
                  Generate Report
                </Button>
              </div>
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-16 w-16 text-red-600 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Generating Analysis Report</h3>
                <p className="text-muted-foreground mb-4">AI is creating a comprehensive health analysis based on the extracted data...</p>
                
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  This usually takes 20-40 seconds
                </p>
              </div>
            </div>
          )}

          {/* Editing Step */}
          {step === 'editing' && (
            <div className="flex flex-col flex-1 space-y-4 min-h-0">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-medium">Review & Edit Blood Test Analysis</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('reviewing')}>
                    Back to Review
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600">
                    {isSaving ? (
                      <>
                        <FileText className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Analysis Report'
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

              {/* Edit Area */}
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Edit Panel */}
                <div className="border rounded-lg flex flex-col min-h-0">
                  <div className="p-3 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                    <h4 className="text-sm font-medium text-muted-foreground">Edit the generated blood test analysis</h4>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <Textarea
                      value={editedReport}
                      onChange={(e) => setEditedReport(e.target.value)}
                      className="w-full h-full font-mono text-sm resize-none border-0 p-4"
                      placeholder="Generated blood test analysis will appear here..."
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
                      <ReactMarkdown>{editedReport}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 