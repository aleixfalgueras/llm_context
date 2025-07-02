'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, FileText, Save, RefreshCw, Edit, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ClientVariablesTooltip } from '@/components/ui/client-variables-tooltip'
import { MarkdownRenderer } from '@/components/global/markdown-renderer'
import { CLIENT_CONTEXT_FIELD_LABELS } from '@/types/client'
import type { Client } from '@/types/client'
import { useDocumentGenerator } from '@/hooks/use-document-generator'

interface CustomDocumentGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

export function CustomDocumentGeneratorDialog({
  isOpen,
  onClose,
  clients,
  onDocumentCreated,
}: CustomDocumentGeneratorDialogProps) {
  const {
    // State
    selectedClient,
    documentTitle,
    selectedPrompt,
    customPrompt,
    clientContext,
    prompts,
    generatedContent,
    promptName,
    useCustomPrompt,
    isEditMode,
    
    // Loading states
    isGenerating,
    isSaving,
    isLoadingPrompts,
    
    // Actions
    setSelectedClient,
    setDocumentTitle,
    handlePromptChange,
    setClientContext,
    setCustomPrompt,
    setUseCustomPrompt,
    setGeneratedContent,
    setIsEditMode,
    generateDocument,
    handleSaveDocument,
    resetForm,
    selectAllContext,
    deselectAllContext,
  } = useDocumentGenerator({
    isOpen,
    clients,
    onDocumentCreated,
  })

  const selectedClientData = clients.find(c => c.id === selectedClient)

  const handleClose = () => {
    resetForm()
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
                      onChange={(e) => setClientContext({
                        ...clientContext,
                        country: e.target.checked
                      })}
                      label={`Country (${selectedClientData.country})`}
                    />
                  </div>
                )}
                {selectedClientData?.generalContext && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-general-context"
                      checked={clientContext.general_context}
                      onChange={(e) => setClientContext({
                        ...clientContext,
                        general_context: e.target.checked
                      })}
                      label={CLIENT_CONTEXT_FIELD_LABELS.general_context}
                    />
                  </div>
                )}
                {selectedClientData?.specifiContext1 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-specific-context-1"
                      checked={clientContext.specific_context_1}
                      onChange={(e) => setClientContext({
                        ...clientContext,
                        specific_context_1: e.target.checked
                      })}
                      label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_1}
                    />
                  </div>
                )}
                {selectedClientData?.specifiContext2 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-specific-context-2"
                      checked={clientContext.specific_context_2}
                      onChange={(e) => setClientContext({
                        ...clientContext,
                        specific_context_2: e.target.checked
                      })}
                      label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_2}
                    />
                  </div>
                )}
                {selectedClientData?.specifiContext3 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="context-specific-context-3"
                      checked={clientContext.specific_context_3}
                      onChange={(e) => setClientContext({
                        ...clientContext,
                        specific_context_3: e.target.checked
                      })}
                      label={CLIENT_CONTEXT_FIELD_LABELS.specific_context_3}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllContext}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAllContext}
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
                  placeholder="Write your custom prompt here... You can use variables like {country}, {general_context}, {specific_context_1}, {specific_context_2}, {specific_context_3}."
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
              onClick={generateDocument}
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
                onClick={generateDocument}
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
                onClick={() => handleSaveDocument().then(() => onClose())}
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