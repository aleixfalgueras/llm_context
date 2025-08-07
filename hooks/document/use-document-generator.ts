'use client'

import {useEffect, useState} from 'react'
import {useToast} from '@/hooks/use-toast'
import {getDefaultModel} from '@/lib/models-config'
import {clientLogger} from '@/lib/client-logger'
import type {Client, Prompt} from '@prisma/client'
import {handleClientApiError} from '@/lib/api/api-toast'
import {ClientContextSelection, DEFAULT_CLIENT_CONTEXT} from "@/lib/types/client-types"
import {getPrompts} from '@/app/actions/prompt-action'

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
  selectedPromptContent: string
  customPrompt: string
  clientContext: ClientContextSelection
  prompts: Prompt[]
  promptName: string
  useCustomPrompt: boolean
  
  // Loading states
  isLoadingPrompts: boolean
  
  // Actions
  setSelectedClient: (id: string) => void
  setDocumentTitle: (title: string) => void
  handlePromptChange: (promptId: string) => void
  setSelectedPromptContent: (content: string) => void
  setClientContext: (context: ClientContextSelection) => void
  setCustomPrompt: (prompt: string) => void
  setUseCustomPrompt: (use: boolean) => void
  generateDocument: () => Promise<string>
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
  const [selectedPromptContent, setSelectedPromptContent] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [clientContext, setClientContext] = useState<ClientContextSelection>(DEFAULT_CLIENT_CONTEXT)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [promptName, setPromptName] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
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
      setClientContext(DEFAULT_CLIENT_CONTEXT)
    }
  }, [selectedClient])

  const loadPrompts = async () => {
    setIsLoadingPrompts(true)
    try {
      const data = await getPrompts({
        isActive: true,
        includeContent: true
      })
      setPrompts(data || [])
    } catch (error) {
      console.error('Error loading prompts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load prompts'
      handleClientApiError(errorMessage, 'Failed to load prompts')
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const handlePromptChange = (promptId: string) => {
    setSelectedPrompt(promptId)
    const prompt = prompts.find(p => p.id === promptId)
    if (prompt) {
      setSelectedPromptContent(prompt.content)
    }
  }

  const generateDocument = async (): Promise<string> => {
    const finalPrompt = useCustomPrompt ? customPrompt : selectedPromptContent || ''
    
    if (!selectedClient || !documentTitle || !finalPrompt.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a client, enter a document title, and choose a prompt or write custom instructions.',
        variant: 'destructive',
      })
      throw new Error('Missing required fields')
    }

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
          customPrompt: finalPrompt,
          selectedContextFields: Object.entries(clientContext)
            .filter(([, value]) => value)
            .map(([key]) => key),
          model: getDefaultModel()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate document' }))
        throw new Error(errorData.error)
      }

      const data = await response.json()
      setPromptName(data.promptName || (useCustomPrompt ? 'Custom Prompt' : prompts.find(p => p.id === selectedPrompt)?.name || ''))
      return data.content
    } catch (error) {
      console.error('Error generating document:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate document'
      handleClientApiError(errorMessage, 'Failed to generate document')
      throw error
    }
  }


  const resetForm = () => {
    setSelectedClient('')
    setDocumentTitle('')
    setSelectedPrompt('')
    setSelectedPromptContent('')
    setCustomPrompt('')
    setClientContext(DEFAULT_CLIENT_CONTEXT)
    setPromptName('')
    setUseCustomPrompt(false)
  }

  const selectAllContext = () => {
    setClientContext({
      country: true,
      generalContext: true,
      specificContext1: true,
      specificContext2: true,
      specificContext3: true
    })
  }

  const deselectAllContext = () => {
    setClientContext({
      country: false,
      generalContext: false,
      specificContext1: false,
      specificContext2: false,
      specificContext3: false
    })
  }

  return {
    // State
    selectedClient,
    documentTitle,
    selectedPrompt,
    selectedPromptContent,
    customPrompt,
    clientContext,
    prompts,
    promptName,
    useCustomPrompt,
    
    // Loading states
    isLoadingPrompts,
    
    // Actions
    setSelectedClient,
    setDocumentTitle,
    handlePromptChange,
    setSelectedPromptContent,
    setClientContext,
    setCustomPrompt,
    setUseCustomPrompt,
    generateDocument,
    resetForm,
    selectAllContext,
    deselectAllContext,
  }
}