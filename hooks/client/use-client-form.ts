'use client'

import { useFormState } from '../use-form-state'
import { useFormOperations } from '../use-async-operation'
import { createClient, updateClient } from '@/app/actions/client-action'
import { Prisma } from '@prisma/client'
import { validateClientForm } from '@/lib/utils/validation'
import { capitalizeName } from '@/lib/utils/general'
import React from "react";
import {getLanguageOptionsClient} from "@/lib/utils/client-language";
import {useLocale} from "@/lib/translations/context";

interface UseClientFormProps {
  client?: any
  onSuccess?: () => void
}

// Form-safe version of ClientCreateInput with strings instead of nulls
type ClientFormData = {
  name: string
  email: string
  phone: string
  country: string
  generalContext: string
  specificContext1: string
  specificContext2: string
  specificContext3: string
  documentsLanguage: string
}

interface UseClientFormReturn {
  // Form state
  formData: ClientFormData
  errors: Partial<Record<keyof ClientFormData, string>>
  isValid: boolean
  isDirty: boolean
  
  // Loading state
  isLoading: boolean
  error: string | null
  
  // Actions
  updateField: (field: keyof ClientFormData, value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
  clearError: () => void
  
  // Available options
  languages: Array<{ value: string; label: string }>
}

const validationRules: Partial<Record<keyof ClientFormData, (value: any) => string | null>> = {
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

/**
 * Convert form data (with empty strings) to Prisma format (with nulls)
 */
function convertFormDataToPrismaFormat(formData: ClientFormData): Omit<Prisma.ClientCreateInput, 'userId'> {
  return {
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    country: formData.country || null,
    generalContext: formData.generalContext || null,
    specificContext1: formData.specificContext1 || null,
    specificContext2: formData.specificContext2 || null,
    specificContext3: formData.specificContext3 || null,
    documentsLanguage: formData.documentsLanguage || 'en',
  }
}

export function useClientForm({ client, onSuccess }: UseClientFormProps): UseClientFormReturn {
  const { isLoading, error, clearError, save, create } = useFormOperations()
  const locale = useLocale()

  const initialData: ClientFormData = {
    name: client?.name || '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    country: client?.country ?? '',
    generalContext: client?.generalContext ?? '',
    specificContext1: client?.specificContext1 ?? '',
    specificContext2: client?.specificContext2 ?? '',
    specificContext3: client?.specificContext3 ?? '',
    documentsLanguage: client?.documentsLanguage || locale
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

  // Use centralized language options from translations - single source of truth
  const languages = getLanguageOptionsClient(locale)

  const updateField = (field: keyof ClientFormData, value: string) => {
    updateFormField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use centralized validation
    const validation = validateClientForm(formData)
    if (!validation.isValid) {
      // Show validation error toast
      if (validation.firstError) {
        clearError() // Clear any previous errors
        const { toast } = await import('@/hooks/use-toast')
        toast({
          title: 'Validation Error',
          description: validation.firstError,
          variant: 'destructive'
        })
      }
      return
    }

    // Format and convert the data before saving
    const formattedFormData = {
      ...formData,
      name: capitalizeName(formData.name)
    }
    
    // Convert to Prisma format (empty strings → null)
    const prismaData = convertFormDataToPrismaFormat(formattedFormData)

    let result
    if (client?.id) {
      result = await save(
        () => updateClient(client.id, prismaData),
        'client'
      )
    } else {
      result = await create(
        () => createClient(prismaData),
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