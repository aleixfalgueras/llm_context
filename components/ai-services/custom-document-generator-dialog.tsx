'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from 'lucide-react'
import { ClientVariablesTooltip } from '@/components/ui/client-variables-tooltip'
import { CLIENT_CONTEXT_FIELD_LABELS, CLIENT_CONTEXT_FIELDS } from '@/types/client'
import type { Client } from '@/types/client'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { useDocumentGenerator } from '@/hooks/use-document-generator'
import { BaseAIServiceDialog } from './base-ai-service-dialog'
import type { BaseAIServiceDialogConfig, ValidationResult } from './base-ai-service-dialog'

interface CustomDocumentGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

interface CustomDocumentFormData {
  clientId: string
  documentTitle: string
  selectedPrompt: string
  customPrompt: string
  useCustomPrompt: boolean
  clientContext: ClientContextSelection
}

export function CustomDocumentGeneratorDialog({
  isOpen,
  onClose,
  clients,
  onDocumentCreated,
}: CustomDocumentGeneratorDialogProps) {
  const {
    // State from hook
    selectedClient,
    documentTitle,
    selectedPrompt,
    customPrompt,
    clientContext,
    prompts,
    generatedContent,
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
    setIsEditMode,
    generateDocument,
    resetForm,
    selectAllContext,
    deselectAllContext,
  } = useDocumentGenerator({
    isOpen,
    clients,
    onDocumentCreated,
  })

  // Convert hook state to form data format for base component
  const formData: CustomDocumentFormData = {
    clientId: selectedClient,
    documentTitle: documentTitle,
    selectedPrompt: selectedPrompt,
    customPrompt: customPrompt,
    useCustomPrompt: useCustomPrompt,
    clientContext: clientContext
  }

  // Get selected client
  const getSelectedClient = (data: CustomDocumentFormData) => 
    clients.find(c => c.id === data.clientId)

  const selectedClientData = getSelectedClient(formData)

  // Handle form data changes (sync with hook)
  const handleFormDataChange = (newData: CustomDocumentFormData) => {
    if (newData.clientId !== selectedClient) {
      setSelectedClient(newData.clientId)
    }
    if (newData.documentTitle !== documentTitle) {
      setDocumentTitle(newData.documentTitle)
    }
    if (newData.selectedPrompt !== selectedPrompt) {
      handlePromptChange(newData.selectedPrompt)
    }
    if (newData.customPrompt !== customPrompt) {
      setCustomPrompt(newData.customPrompt)
    }
    if (newData.useCustomPrompt !== useCustomPrompt) {
      setUseCustomPrompt(newData.useCustomPrompt)
    }
    if (JSON.stringify(newData.clientContext) !== JSON.stringify(clientContext)) {
      setClientContext(newData.clientContext)
    }
  }

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    // Reset client context when client changes
    setClientContext(defaultClientContextSelections.general)
  }

  // Custom wrapper for generation that uses hook logic
  const handleCustomGenerate = async () => {
    return await generateDocument()
  }


  // Handle edit mode changes
  const handleEditModeChange = (editMode: boolean) => {
    setIsEditMode(editMode)
  }

  // Override base dialog close behavior
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Configuration for the base dialog
  const config: BaseAIServiceDialogConfig<CustomDocumentFormData> = {
    title: 'Document Generator',
    description: 'Generate professional documents using your custom prompts with client-specific information.',
    icon: FileText,
    themeColor: 'blue',
    
    generateEndpoint: '/api/ai-services/generate-custom-document',
    saveEndpoint: '/api/ai-services/save-custom-document',
    
    // Use custom handlers that delegate to hook
    buildGeneratePayload: () => {
      // This won't be used as we override with custom handler
      return {}
    },
    
    buildSavePayload: (formData: CustomDocumentFormData, content: string, client?: Client) => {
      const prompt = prompts.find(p => p.id === formData.selectedPrompt)
      return {
        clientId: formData.clientId,
        content: content,
        documentTitle: formData.documentTitle,
        promptName: formData.useCustomPrompt ? 'Custom Prompt' : prompt?.name || '',
      }
    },
    
    validateGeneration: (data: CustomDocumentFormData): ValidationResult => {
      if (!data.clientId) {
        return { isValid: false, message: 'Please select a client' }
      }
      if (data.useCustomPrompt && !data.customPrompt.trim()) {
        return { isValid: false, message: 'Please provide a custom prompt' }
      }
      if (!data.useCustomPrompt && !data.selectedPrompt) {
        return { isValid: false, message: 'Please select a prompt or write a custom one' }
      }
      return { isValid: true }
    },
    
    validateSave: (data: CustomDocumentFormData, content: string): ValidationResult => {
      if (!content.trim()) {
        return { isValid: false, message: 'Please generate content before saving' }
      }
      if (!data.documentTitle.trim()) {
        return { isValid: false, message: 'Please provide a document title' }
      }
      return { isValid: true }
    },
    
    generateDefaultName: (data: CustomDocumentFormData, client?: Client) => {
      if (client) {
        const promptTitle = data.useCustomPrompt ? 'Custom Document' : 
          (prompts.find(p => p.id === data.selectedPrompt)?.name || 'Document')
        return `${client.name} - ${promptTitle}`
      }
      return 'Custom Document'
    },
    
    getDocumentNameField: (data: CustomDocumentFormData) => data.documentTitle,
    
    setDocumentNameField: (data: CustomDocumentFormData, name: string) => ({
      ...data,
      documentTitle: name
    }),
    
    getSuccessMessage: (client?: Client) => 
      client ? `📄 Generating document for ${client.name}` : 'Generating document...'
  }

  // Client Context section
  const renderClientContext = () => (
    selectedClientData && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Client Context</Label>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={selectAllContext}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllContext}>
              Deselect All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(CLIENT_CONTEXT_FIELD_LABELS).map(([key, label]) => {
            const actualFieldName = CLIENT_CONTEXT_FIELDS[key as keyof typeof CLIENT_CONTEXT_FIELDS]
            const fieldValue = selectedClientData[actualFieldName as keyof Client]
            const hasValue = fieldValue && String(fieldValue).trim() !== ''
            
            // Only render fields that have values
            if (!hasValue) return null
            
            return (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`context-${key}`}
                  checked={clientContext[key as keyof ClientContextSelection] || false}
                  onChange={(e) => {
                    const newClientContext = { 
                      ...clientContext, 
                      [key as keyof ClientContextSelection]: e.target.checked 
                    }
                    setClientContext(newClientContext)
                  }}
                />
                <Label htmlFor={`context-${key}`}>
                  {label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    )
  )

  // Custom fields for document generator (Prompt Selection only)
  const renderCustomFields = () => (
    <>
      {/* Prompt Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-custom-prompt"
            checked={useCustomPrompt}
            onChange={(e) => setUseCustomPrompt(e.target.checked)}
          />
          <Label htmlFor="use-custom-prompt">Use custom prompt</Label>
        </div>

        {useCustomPrompt ? (
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Custom Prompt *</Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Write your custom prompt here..."
              className="min-h-[120px]"
            />
            <ClientVariablesTooltip />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Select Prompt</Label>
            <Select value={selectedPrompt} onValueChange={handlePromptChange} disabled={isLoadingPrompts}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPrompts ? "Loading prompts..." : "Choose a prompt..."} />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </>
  )

  return (
    <BaseAIServiceDialog
      open={isOpen}
      onOpenChange={handleClose}
      clients={clients}
      onDocumentCreated={onDocumentCreated}
      config={config}
      formData={formData}
      onFormDataChange={handleFormDataChange}
      getSelectedClient={getSelectedClient}
      onClientChange={handleClientChange}
      renderClientContext={renderClientContext}
      renderCustomFields={renderCustomFields}
      customGenerateHandler={handleCustomGenerate}
      customGeneratedContent={generatedContent}
      customIsGenerating={isGenerating}
      customIsSaving={isSaving}
      customIsEditMode={isEditMode}
      onCustomEditModeChange={handleEditModeChange}
    />
  )
}