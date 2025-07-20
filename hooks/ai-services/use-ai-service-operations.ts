/**
 * Hook for managing AI service operations (generate and save)
 */

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ServiceApi } from '@/lib/ai/service-api'
import type { Client } from '@/types/client'

interface UseAIServiceOperationsProps<TFormData> {
  generateEndpoint: string
  saveEndpoint: string
  buildGeneratePayload: (formData: TFormData, client?: Client) => any
  buildSavePayload: (formData: TFormData, content: string, client?: Client) => any
  onSaveSuccess?: (documentId: string) => void
}

export function useAIServiceOperations<TFormData>({
  generateEndpoint,
  saveEndpoint,
  buildGeneratePayload,
  buildSavePayload,
  onSaveSuccess
}: UseAIServiceOperationsProps<TFormData>) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [hasGenerated, setHasGenerated] = useState(false)
  const { toast } = useToast()

  const generateContent = async (formData: TFormData, client?: Client) => {
    setIsGenerating(true)
    try {
      const payload = buildGeneratePayload(formData, client)
      const result = await ServiceApi.generateContent(generateEndpoint, payload)
      
      if (result.success && result.content) {
        setGeneratedContent(result.content)
        setHasGenerated(true)
        return true
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate content",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "An unexpected error occurred during generation.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  const saveDocument = async (formData: TFormData, documentName: string, client?: Client) => {
    if (!generatedContent) {
      toast({
        title: "No Content",
        description: "Please generate content before saving.",
        variant: "destructive"
      })
      return false
    }

    setIsSaving(true)
    try {
      const payload = buildSavePayload(formData, generatedContent, client)
      // Add document name to payload
      payload.name = documentName
      
      const result = await ServiceApi.saveDocument(saveEndpoint, payload)
      
      if (result.success && result.documentId) {
        onSaveSuccess?.(result.documentId)
        return true
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save document",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const regenerateContent = async (formData: TFormData, client?: Client) => {
    setHasGenerated(false)
    setGeneratedContent('')
    return await generateContent(formData, client)
  }

  const resetOperations = () => {
    setGeneratedContent('')
    setHasGenerated(false)
    setIsGenerating(false)
    setIsSaving(false)
  }

  return {
    isGenerating,
    isSaving,
    generatedContent,
    hasGenerated,
    generateContent,
    saveDocument,
    regenerateContent,
    resetOperations,
    setGeneratedContent
  }
}