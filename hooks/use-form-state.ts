'use client'

import { useState, useCallback } from 'react'

interface UseFormStateProps<T> {
  initialData: T
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
}

interface UseFormStateReturn<T> {
  // State
  formData: T
  errors: Partial<Record<keyof T, string>>
  isValid: boolean
  isDirty: boolean
  
  // Actions
  updateField: (field: keyof T, value: any) => void
  updateFormData: (data: Partial<T>) => void
  validateField: (field: keyof T) => boolean
  validateForm: () => boolean
  resetForm: () => void
  setFormData: (data: T) => void
  clearErrors: () => void
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  validationRules = {},
}: UseFormStateProps<T>): UseFormStateReturn<T> {
  const [formData, setFormData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isDirty, setIsDirty] = useState(false)

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const updateFormData = useCallback((data: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...data }))
    setIsDirty(true)
  }, [])

  const validateField = useCallback((field: keyof T): boolean => {
    const validator = validationRules[field]
    if (!validator) return true

    const error = validator(formData[field])
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
      return false
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      return true
    }
  }, [formData, validationRules])

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isFormValid = true

    Object.keys(validationRules).forEach(field => {
      const validator = validationRules[field as keyof T]
      if (validator) {
        const error = validator(formData[field as keyof T])
        if (error) {
          newErrors[field as keyof T] = error
          isFormValid = false
        }
      }
    })

    setErrors(newErrors)
    return isFormValid
  }, [formData, validationRules])

  const resetForm = useCallback(() => {
    setFormData(initialData)
    setErrors({})
    setIsDirty(false)
  }, [initialData])

  const setFormDataCallback = useCallback((data: T) => {
    setFormData(data)
    setErrors({})
    setIsDirty(false)
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    // State
    formData,
    errors,
    isValid,
    isDirty,
    
    // Actions
    updateField,
    updateFormData,
    validateField,
    validateForm,
    resetForm,
    setFormData: setFormDataCallback,
    clearErrors,
  }
}