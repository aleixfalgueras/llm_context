'use client'

import {useEffect, useState} from 'react'
import {useToast} from '@/hooks/use-toast'
import type {Prompt} from '@prisma/client'
import {handleClientApiError} from '@/lib/api/api-toast'
import {ClientContextSelection, DEFAULT_CLIENT_CONTEXT} from "@/lib/types/client-types"
import {getPrompts} from '@/app/actions/prompt-action'

interface UseDocumentGeneratorProps {
  isOpen: boolean
}

interface UseDocumentGeneratorReturn {
  // State
  selectedClient: string
  documentTitle: string
  selectedPrompt: string
  promptContent: string
  clientContext: ClientContextSelection
  prompts: Prompt[]
  promptName: string

  // Actions
  setSelectedClient: (id: string) => void
  setDocumentTitle: (title: string) => void
  handlePromptChange: (promptId: string) => void
  setPromptContent: (content: string) => void
  setClientContext: (context: ClientContextSelection) => void
  resetForm: () => void
  selectAllContext: () => void
  deselectAllContext: () => void
}

export function useDocumentGenerator({isOpen}: UseDocumentGeneratorProps): UseDocumentGeneratorReturn {
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [promptContent, setPromptContent] = useState('')
  const [clientContext, setClientContext] = useState<ClientContextSelection>(DEFAULT_CLIENT_CONTEXT)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [promptName, setPromptName] = useState('')
  const { toast } = useToast()

  // Load prompts and reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Reset form state when dialog opens
      setSelectedClient('')
      setDocumentTitle('')
      setSelectedPrompt('')
      setPromptContent('')
      setClientContext(DEFAULT_CLIENT_CONTEXT)
      setPromptName('')
      // Load prompts
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
      setPromptContent(prompt.content)
    }
  }

  const resetForm = () => {
    setSelectedClient('')
    setDocumentTitle('')
    setSelectedPrompt('')
    setPromptContent('')
    setClientContext(DEFAULT_CLIENT_CONTEXT)
    setPromptName('')
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
    promptContent,
    clientContext,
    prompts,
    promptName,
    
    // Actions
    setSelectedClient,
    setDocumentTitle,
    handlePromptChange,
    setPromptContent,
    setClientContext,
    resetForm,
    selectAllContext,
    deselectAllContext,
  }
}