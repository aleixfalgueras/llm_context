'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileText, Save, Download, RefreshCw, Lightbulb, Plus, Edit, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ClientVariablesTooltip } from '@/components/ui/client-variables-tooltip'
import { MarkdownRenderer } from '@/components/global/markdown-renderer'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai-wrapper'

interface Client {
  id: string
  name: string
  country?: string
  notes?: string
}

interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
}

interface CustomDocumentGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
  selectedModel: string
}

export function CustomDocumentGeneratorDialog({
  isOpen,
  onClose,
  clients,
  onDocumentCreated,
  selectedModel,
}: CustomDocumentGeneratorDialogProps) {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [clientContext, setClientContext] = useState<ClientContextSelection>(defaultClientContextSelections.general)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [promptName, setPromptName] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  // Load prompts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadPrompts()
    }
  }, [isOpen])

  const loadPrompts = async () => {
    setIsLoadingPrompts(true)
    try {
      const response = await fetch('/api/prompts?active=true')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data || [])
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load prompts',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  // Reset client context when client changes
  useEffect(() => {
    if (selectedClient) {
      setClientContext(defaultClientContextSelections.general)
    }
  }, [selectedClient])

  const handlePromptChange = (promptId: string) => {
    setSelectedPrompt(promptId)
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      setCustomPrompt(prompt.content)
    }
  }

  const handleGenerateDocument = async () => {
    if (!selectedClient || !documentTitle || (!selectedPrompt && !customPrompt.trim())) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client, enter a document title, and choose a prompt or write custom instructions.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai-services/generate-custom-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          promptId: useCustomPrompt ? null : selectedPrompt,
          customPrompt: useCustomPrompt ? customPrompt : null,
          documentTitle,
          selectedContextFields: Object.keys(clientContext).filter(key => clientContext[key as keyof ClientContextSelection]),
          model: selectedModel,
        }),
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
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      setPromptName(data.promptName)
    } catch (error) {
      console.error('Error generating document:', error)
      
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate document. Please try again.'
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDocument = async () => {
    if (!generatedContent || !selectedClient || !documentTitle) {
      toast({
        title: 'Missing Information',
        description: 'Please generate a document first.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/ai-services/save-custom-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          content: generatedContent,
          documentTitle,
          promptName,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (onDocumentCreated && data.documentId) {
        toast({
          title: 'Document Saved 📄',
          description: (
            <div>
              <p>Custom document has been saved successfully.</p>
              <button 
                onClick={() => onDocumentCreated(selectedClient, data.documentId)}
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
          title: 'Document Saved 📄',
          description: `Custom document has been saved successfully. You can find it in the Clients page under ${clients.find(c => c.id === selectedClient)?.name}'s documents.`,
          duration: 8000,
        })
      }

      // Reset form
      setSelectedClient('')
      setDocumentTitle('')
      setSelectedPrompt('')
      setCustomPrompt('')
      setClientContext(defaultClientContextSelections.general)
      setGeneratedContent('')
      setPromptName('')
      setUseCustomPrompt(false)
      setIsEditMode(false)
      onClose()
    } catch (error) {
      console.error('Error saving document:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save document. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)

  const handleClose = () => {
    setIsEditMode(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Generator</DialogTitle>
          <DialogDescription>
            Generate professional documents using your custom prompts with client-specific information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Select Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Context Selection */}
          {selectedClientData && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Client Context Selection</Label>
              <p className="text-sm text-muted-foreground">
                Choose which client information to include for document generation:
              </p>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                {selectedClientData?.country && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-country"
                      checked={clientContext.country}
                      onChange={(e) => setClientContext(prev => ({
                        ...prev,
                        country: e.target.checked
                      }))}
                      label={`Country (${selectedClientData.country})`}
                    />
                  </div>
                )}
                {selectedClientData?.notes && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-notes"
                      checked={clientContext.notes}
                      onChange={(e) => setClientContext(prev => ({
                        ...prev,
                        notes: e.target.checked
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
                  onClick={() => setClientContext({
                    country: false,
                    notes: false
                  })}
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
            />
          </div>

          {/* Prompt Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Choose Prompt Source</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustom"
                  checked={useCustomPrompt}
                  onChange={(e) => setUseCustomPrompt(e.target.checked)}
                />
                <Label htmlFor="useCustom" className="text-sm">Write custom prompt</Label>
              </div>
            </div>

            {!useCustomPrompt ? (
              <div className="space-y-2">
                <Label htmlFor="prompt">Select Existing Prompt</Label>
                <Select value={selectedPrompt} onValueChange={handlePromptChange} disabled={isLoadingPrompts}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPrompts ? "Loading prompts..." : prompts.length === 0 ? "No prompts available" : "Choose a prompt..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No active prompts found. Create some prompts in the Prompts page first.
                      </div>
                    ) : (
                      prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          <div className="flex items-center gap-2">
                            <span>{prompt.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {prompt.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedPrompt && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
                    <p className="text-sm text-gray-600">
                      {prompts.find(p => p.id === selectedPrompt)?.description || 'No description available'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="customPrompt">Custom Prompt *</Label>
                  <ClientVariablesTooltip />
                </div>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Write your custom prompt here... You can use variables like {client_name}, {country}, etc."
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generated Document
                  {promptName && (
                    <Badge variant="outline" className="ml-2">
                      {promptName}
                    </Badge>
                  )}
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
                    placeholder="Edit your document content here..."
                  />
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <MarkdownRenderer content={generatedContent} />
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
              onClick={handleGenerateDocument}
              disabled={isGenerating || !selectedClient || !documentTitle || (!selectedPrompt && !customPrompt.trim())}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateDocument}
                disabled={isGenerating}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
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
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Document
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveDocument}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
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