/**
 * Hook for managing AI service form state and validation
 */

import { useState, useCallback } from 'react'
import type { Client } from '@/types/client'
import { ValidationResult } from '@/types/api-types'

interface UseAIServiceFormProps<TFormData> {
  initialData: TFormData
  validateGeneration: (formData: TFormData) => ValidationResult
  validateSave: (formData: TFormData, content: string) => ValidationResult
  generateDefaultName?: (formData: TFormData, client?: Client) => string
}

export function useAIServiceForm<TFormData extends Record<string, any>>({
  initialData,
  validateGeneration,
  validateSave,
  generateDefaultName
}: UseAIServiceFormProps<TFormData>) {
  const [formData, setFormData] = useState<TFormData>(initialData)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [validationError, setValidationError] = useState<string>('')

  const updateFormData = useCallback((updates: Partial<TFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateForm = useCallback((content?: string) => {
    setValidationError('')
    
    const generationValidation = validateGeneration(formData)
    if (!generationValidation.isValid) {
      setValidationError(generationValidation.message || 'Form validation failed')
      return false
    }

    if (content !== undefined) {
      const saveValidation = validateSave(formData, content)
      if (!saveValidation.isValid) {
        setValidationError(saveValidation.message || 'Save validation failed')
        return false
      }
    }

    return true
  }, [formData, validateGeneration, validateSave])

  const generateName = useCallback(() => {
    if (generateDefaultName) {
      const defaultName = generateDefaultName(formData, selectedClient || undefined)
      setDocumentName(defaultName)
    }
  }, [formData, selectedClient, generateDefaultName])

  const resetForm = useCallback(() => {
    setFormData(initialData)
    setSelectedClient(null)
    setDocumentName('')
    setValidationError('')
  }, [initialData])

  return {
    formData,
    selectedClient,
    documentName,
    validationError,
    updateFormData,
    setSelectedClient,
    setDocumentName,
    validateForm,
    generateName,
    resetForm
  }
}