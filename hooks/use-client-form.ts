'use client'

import { useFormState } from './use-form-state'
import { useFormOperations } from './use-async-operation'
import { createClient, updateClient, type ClientData } from '@/lib/client-actions'
import { validateClientForm } from '@/lib/validation-helpers'
import { capitalizeName } from '@/lib/utils'
import { getLanguageOptions } from '@/types/enums'

interface UseClientFormProps {
  client?: any
  onSuccess?: () => void
}

interface UseClientFormReturn {
  // Form state
  formData: ClientData
  errors: Partial<Record<keyof ClientData, string>>
  isValid: boolean
  isDirty: boolean
  
  // Loading state
  isLoading: boolean
  error: string | null
  
  // Actions
  updateField: (field: keyof ClientData, value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
  clearError: () => void
  
  // Available options
  languages: Array<{ value: string; label: string; flag: string }>
}

const validationRules: Partial<Record<keyof ClientData, (value: any) => string | null>> = {
  name: (value: string) => {
    if (!value?.trim()) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    return null
  },
  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },
  phone: (value: string) => {
    if (value && !/^[\+]?[\d\s\-\(\)]+$/.test(value)) {
      return 'Please enter a valid phone number'
    }
    return null
  },
}

export function useClientForm({ client, onSuccess }: UseClientFormProps): UseClientFormReturn {
  const { isLoading, error, clearError, save, create } = useFormOperations()

  const initialData: ClientData = {
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    country: client?.country || '',
    generalContext: client?.generalContext || '',
    specifiContext1: client?.specifiContext1 || '',
    specifiContext2: client?.specifiContext2 || '',
    specifiContext3: client?.specifiContext3 || '',
    documentsLanguage: client?.documentsLanguage || 'english'
  }

  const {
    formData,
    errors,
    isValid,
    isDirty,
    updateField: updateFormField,
    resetForm: resetFormData,
    setFormData,
  } = useFormState({
    initialData,
    validationRules,
  })

  // Use centralized language options from enums - single source of truth
  const languages = getLanguageOptions()

  const updateField = (field: keyof ClientData, value: string) => {
    updateFormField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use centralized validation
    const validation = validateClientForm(formData)
    if (!validation.isValid) {
      // Show first validation error (toast will be shown by async operation)
      return
    }

    // Format the name before saving
    const formattedData = {
      ...formData,
      name: capitalizeName(formData.name)
    }

    let result
    if (client?.id) {
      result = await save(
        () => updateClient(client.id, formattedData),
        'client'
      )
    } else {
      result = await create(
        () => createClient(formattedData),
        'client'
      )
    }

    if (result.success) {
      onSuccess?.()
    }
  }

  const resetForm = () => {
    resetFormData()
    setFormData(initialData)
  }

  return {
    // Form state
    formData,
    errors,
    isValid,
    isDirty,
    
    // Loading state
    isLoading,
    error,
    
    // Actions
    updateField,
    handleSubmit,
    resetForm,
    clearError,
    
    // Available options
    languages,
  }
}