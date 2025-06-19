'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Upload, CheckCircle, AlertCircle, AlertTriangle, FileText, User, Calendar, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { DateInput } from '@/components/ui/date-input'

interface BloodTestAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: any[]
}

export function BloodTestAnalysisDialog({ open, onOpenChange, clients }: BloodTestAnalysisDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'upload' | 'extracting' | 'reviewing' | 'generating' | 'editing'>('upload')
  const [formData, setFormData] = useState({
    clientId: '',
    testDate: '',
    additionalInfo: ''
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
          extractedData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      setGeneratedReport(data.report)
      setEditedReport(data.report)
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
          reportContent: editedReport
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save report')
      }

      const data = await response.json()
      
      toast({
        title: 'Report Saved',
        description: `Blood test analysis has been saved successfully for ${selectedClient?.name}`,
      })

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
    setFormData({ clientId: '', testDate: '', additionalInfo: '' })
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
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-600" />
            Blood Test Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Client Selection and File Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Select Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{client.name}</span>
                            {client.dateOfBirth && (
                              <span className="text-sm text-muted-foreground">
                                (Age: {Math.floor((new Date().getTime() - new Date(client.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

              {/* Client Preview */}
              {selectedClient && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-900 dark:text-blue-100">Client Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{selectedClient.name}</span>
                      </div>
                      {selectedClient.dateOfBirth && (
                        <div className="text-blue-700 dark:text-blue-300">
                          Age: {Math.floor((new Date().getTime() - new Date(selectedClient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old
                        </div>
                      )}
                      {selectedClient.height && selectedClient.weight && (
                        <div className="text-blue-700 dark:text-blue-300">
                          {selectedClient.height}cm, {selectedClient.weight}kg
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleExtract} className="flex-1">
                  Extract Data
                </Button>
              </div>
            </div>
          )}

          {/* Extracting Step */}
          {step === 'extracting' && (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Extracting Blood Test Data</h3>
              <p className="text-muted-foreground">AI is analyzing your PDF and extracting blood test parameters...</p>
            </div>
          )}

          {/* Reviewing Step */}
          {step === 'reviewing' && extractedData && (
            <div className="space-y-6">
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
                                  const updatedParams = [...extractedData.parameters]
                                  updatedParams[originalIndex] = { ...updatedParams[originalIndex], value: e.target.value }
                                  setExtractedData({ ...extractedData, parameters: updatedParams })
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
                                  const updatedParams = [...extractedData.parameters]
                                  updatedParams[originalIndex] = { ...updatedParams[originalIndex], referenceMin: e.target.value }
                                  setExtractedData({ ...extractedData, parameters: updatedParams })
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
                                  const updatedParams = [...extractedData.parameters]
                                  updatedParams[originalIndex] = { ...updatedParams[originalIndex], referenceMax: e.target.value }
                                  setExtractedData({ ...extractedData, parameters: updatedParams })
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
                                   const updatedParams = [...extractedData.parameters]
                                   updatedParams[originalIndex] = { 
                                     ...updatedParams[originalIndex], 
                                     status: value === 'unspecified' ? null : value 
                                   }
                                   setExtractedData({ ...extractedData, parameters: updatedParams })
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

              <div className="flex gap-3">
                <Button onClick={() => setStep('upload')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleGenerate} className="flex-1">
                  Generate Report
                </Button>
              </div>
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Generating Analysis Report</h3>
              <p className="text-muted-foreground">AI is creating a comprehensive health analysis based on the extracted data...</p>
            </div>
          )}

          {/* Editing Step */}
          {step === 'editing' && (
            <div className="flex flex-col flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Review & Edit Blood Test Analysis</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('reviewing')}>
                    Back to Review
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
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

              {/* Edit Area */}
              <div className="grid grid-cols-2 gap-4" style={{ height: 'calc(100vh - 300px)' }}>
                <Card className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">
                      Edit the generated blood test analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <Textarea
                      value={editedReport}
                      onChange={(e) => setEditedReport(e.target.value)}
                      className="w-full h-full font-mono text-sm resize-none border-0 rounded-none p-4"
                      placeholder="Generated blood test analysis will appear here..."
                      style={{ minHeight: 'calc(100vh - 400px)' }}
                    />
                  </CardContent>
                </Card>

                <Card className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{editedReport}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 