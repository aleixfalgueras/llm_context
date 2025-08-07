'use client'

import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Checkbox} from '@/components/ui/checkbox'
import {FileText} from 'lucide-react'
import type {Client, Prompt} from '@prisma/client'
import {
  CLIENT_CONTEXT_FIELDS, 
  ClientContextSelection,
  DEFAULT_CLIENT_CONTEXT
} from '@/lib/types/client-types'
import {useDocumentGenerator} from '@/hooks/document/use-document-generator'
import type {BaseAIServiceDialogConfig, ValidationResult} from './base-ai-service-dialog'
import {BaseAIServiceDialog} from './base-ai-service-dialog'
import {PromptSelector} from '@/components/prompts/prompt-selector'
import {getDefaultModel} from '@/lib/models-config'
import {replaceClientContextVariables} from "@/services/client/client-context-service";

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
  promptContent: string
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
    promptContent,
    clientContext,
    prompts,
    
    // Loading states
    isLoadingPrompts,
    
    // Actions
    setSelectedClient,
    setDocumentTitle,
    handlePromptChange,
    setPromptContent,
    setClientContext,
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
    promptContent: promptContent,
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
    if (newData.promptContent !== promptContent) {
      setPromptContent(newData.promptContent)
    }
    if (JSON.stringify(newData.clientContext) !== JSON.stringify(clientContext)) {
      setClientContext(newData.clientContext)
    }
  }

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId)
    // Reset client context when client changes
    setClientContext(DEFAULT_CLIENT_CONTEXT)
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
    
    buildGeneratePayload: (formData: CustomDocumentFormData, client?: Client) => {
      return {
        clientId: formData.clientId,
        documentTitle: formData.documentTitle,
        customPrompt: formData.promptContent,
        selectedContextFields: Object.entries(formData.clientContext)
          .filter(([, value]) => value)
          .map(([key]) => key),
        model: getDefaultModel()
      }
    },
    
    buildSavePayload: (formData: CustomDocumentFormData, content: string, client?: Client) => {
      const prompt = prompts.find(p => p.id === formData.selectedPrompt)
      return {
        clientId: formData.clientId,
        content: content,
        documentTitle: formData.documentTitle,
        promptName: prompt?.name || 'Custom Prompt',
      }
    },
    
    validateGeneration: (data: CustomDocumentFormData): ValidationResult => {
      if (!data.clientId) {
        return { isValid: false, message: 'Please select a client' }
      }
      if (!data.documentTitle.trim()) {
        return { isValid: false, message: 'Please provide a document title' }
      }
      if (!data.promptContent.trim()) {
        return { isValid: false, message: 'Please provide prompt instructions' }
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
        const promptTitle = prompts.find(p => p.id === data.selectedPrompt)?.name || 'Custom Document'
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
          {Object.entries(CLIENT_CONTEXT_FIELDS).map(([key, label]) => {
            const fieldValue = selectedClientData[key as keyof Client]
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
        <div className="flex items-center">
          <PromptSelector
            onPromptSelect={(prompt: Prompt) => {
              handlePromptChange(prompt.id)
              // Replace variables with client data if available
              const processedContent = selectedClientData 
                ? replaceClientContextVariables(prompt.content, selectedClientData)
                : prompt.content
              
              // If there's existing content, add two line breaks before appending
              const currentContent = promptContent.trim()
              const newContent = currentContent 
                ? `${currentContent}\n\n${processedContent}`
                : processedContent
              
              setPromptContent(newContent)
            }}
          />
        </div>

        {/* Prompt Content Editor */}
        <div className="space-y-2">
          <Label htmlFor="prompt-content">Prompt Content</Label>
          <Textarea
            id="prompt-content"
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            placeholder="Select a prompt from above or write your custom instructions here..."
            className="min-h-[120px]"
          />
        </div>
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
    />
  )
}