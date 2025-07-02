'use client'

import { useState } from 'react'
import { useFormState } from './use-form-state'
import { useToast } from '@/hooks/use-toast'
import { 
  ToastVariant,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPE_DESCRIPTIONS,
  PRIORITY_LABELS,
  FEEDBACK_TYPE_VALUES,
  PRIORITY_VALUES
} from '@/types/enums'

interface FeedbackFormData {
  type: string
  title: string
  description: string
  priority: string
  useCase: string
  stepsToReproduce: string
}

interface UseFeedbackFormReturn {
  // Form state
  formData: FeedbackFormData
  errors: Partial<Record<keyof FeedbackFormData, string>>
  isValid: boolean
  isDirty: boolean
  
  // Loading state
  isSubmitting: boolean
  
  // Actions
  updateField: (field: keyof FeedbackFormData, value: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  resetForm: () => void
  
  // Static data
  feedbackTypes: Array<{ value: string; label: string; description: string }>
  priorities: Array<{ value: string; label: string }>
}

const validationRules: Partial<Record<keyof FeedbackFormData, (value: any) => string | null>> = {
  type: (value: string) => {
    if (!value?.trim()) return 'Feedback type is required'
    return null
  },
  title: (value: string) => {
    if (!value?.trim()) return 'Title is required'
    if (value.trim().length < 5) return 'Title must be at least 5 characters'
    return null
  },
  description: (value: string) => {
    if (!value?.trim()) return 'Description is required'
    if (value.trim().length < 10) return 'Description must be at least 10 characters'
    return null
  },
  priority: (value: string) => {
    if (!value?.trim()) return 'Priority is required'
    return null
  },
}

export function useFeedbackForm(): UseFeedbackFormReturn {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialData: FeedbackFormData = {
    type: '',
    title: '',
    description: '',
    priority: '',
    useCase: '',
    stepsToReproduce: ''
  }

  const {
    formData,
    errors,
    isValid,
    isDirty,
    updateField: updateFormField,
    validateForm,
    resetForm: resetFormData,
  } = useFormState({
    initialData,
    validationRules,
  })

  const feedbackTypes = FEEDBACK_TYPE_VALUES.map(type => ({
    value: type,
    label: FEEDBACK_TYPE_LABELS[type],
    description: FEEDBACK_TYPE_DESCRIPTIONS[type]
  }))

  const priorities = PRIORITY_VALUES.map(priority => ({
    value: priority,
    label: PRIORITY_LABELS[priority]
  }))

  const updateField = (field: keyof FeedbackFormData, value: string) => {
    updateFormField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: ToastVariant.DESTRUCTIVE,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        const typeLabel = feedbackTypes.find(t => t.value === formData.type)?.label || 'Feedback'
        toast({
          title: `${typeLabel} Submitted`,
          description: 'Thank you for your feedback! We\'ll review it carefully.',
        })
        resetForm()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit feedback',
          variant: ToastVariant.DESTRUCTIVE,
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: ToastVariant.DESTRUCTIVE,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    resetFormData()
  }

  return {
    // Form state
    formData,
    errors,
    isValid,
    isDirty,
    
    // Loading state
    isSubmitting,
    
    // Actions
    updateField,
    handleSubmit,
    resetForm,
    
    // Static data
    feedbackTypes,
    priorities,
  }
}