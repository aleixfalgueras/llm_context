'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ClientContextSelection, defaultClientContextSelections } from '@/types/client-context'
import { AIProviderError, getAIErrorMessage } from '@/lib/ai-errors'
import { getDefaultModel } from '@/lib/models-config'
import { clientLogger } from '@/lib/client-logger'
import { Prompt } from '@/types/component-types'
import type { Client } from '@/types/client'

interface UseDocumentGeneratorProps {
  isOpen: boolean
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
}

interface UseDocumentGeneratorReturn {
  // State
  selectedClient: string
  documentTitle: string
  selectedPrompt: string
  customPrompt: string
  clientContext: ClientContextSelection
  prompts: Prompt[]
  generatedContent: string
  promptName: string
  useCustomPrompt: boolean
  isEditMode: boolean
  
  // Loading states
  isGenerating: boolean
  isSaving: boolean
  isLoadingPrompts: boolean
  
  // Actions
  setSelectedClient: (id: string) => void
  setDocumentTitle: (title: string) => void
  handlePromptChange: (promptId: string) => void
  setClientContext: (context: ClientContextSelection) => void
  setCustomPrompt: (prompt: string) => void
  setUseCustomPrompt: (use: boolean) => void
  setGeneratedContent: (content: string) => void
  setIsEditMode: (edit: boolean) => void
  generateDocument: () => Promise<void>
  resetForm: () => void
  selectAllContext: () => void
  deselectAllContext: () => void
}

export function useDocumentGenerator({
  isOpen,
  clients,
  onDocumentCreated,
}: UseDocumentGeneratorProps): UseDocumentGeneratorReturn {
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

  // Reset client context when client changes
  useEffect(() => {
    if (selectedClient) {
      setClientContext(defaultClientContextSelections.general)
    }
  }, [selectedClient])

  const loadPrompts = async () => {
    setIsLoadingPrompts(true)
    try {
      const response = await fetch('/api/prompts?active=true&includeContent=true')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.data.prompts || [])
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

  const handlePromptChange = (promptId: string) => {
    setSelectedPrompt(promptId)
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      setCustomPrompt(prompt.content)
    }
  }

  const generateDocument = async () => {
    const finalPrompt = useCustomPrompt ? customPrompt : prompts.find(p => p.id === selectedPrompt)?.content || ''
    
    if (!selectedClient || !documentTitle || !finalPrompt.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client, enter a document title, and choose a prompt or write custom instructions.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)

    try {
      clientLogger.apiCall('POST', '/api/ai-services/generate-custom-document', {
        clientId: selectedClient,
        component: 'CustomDocumentGeneratorDialog'
      });

      const response = await fetch('/api/ai-services/generate-custom-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          documentTitle: documentTitle,
          ...(useCustomPrompt 
            ? { customPrompt: finalPrompt }
            : { promptId: selectedPrompt }
          ),
          selectedContextFields: Object.entries(clientContext)
            .filter(([, value]) => value)
            .map(([key]) => key),
          model: getDefaultModel()
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
      setPromptName(data.promptName || (useCustomPrompt ? 'Custom Prompt' : prompts.find(p => p.id === selectedPrompt)?.name || ''))
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


  const resetForm = () => {
    setSelectedClient('')
    setDocumentTitle('')
    setSelectedPrompt('')
    setCustomPrompt('')
    setClientContext(defaultClientContextSelections.general)
    setGeneratedContent('')
    setPromptName('')
    setUseCustomPrompt(false)
    setIsEditMode(false)
  }

  const selectAllContext = () => {
    setClientContext({
      country: true,
      general_context: true,
      specific_context_1: true,
      specific_context_2: true,
      specific_context_3: true
    })
  }

  const deselectAllContext = () => {
    setClientContext({
      country: false,
      general_context: false,
      specific_context_1: false,
      specific_context_2: false,
      specific_context_3: false
    })
  }

  return {
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
    resetForm,
    selectAllContext,
    deselectAllContext,
  }
}