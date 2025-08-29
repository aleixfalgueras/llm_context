'use client'

import {useState} from 'react'
import {useFormState} from './use-form-state'
import {useToast} from '@/hooks/use-toast'
import {useTranslations} from '@/lib/translations/context'
import {ToastVariant} from '@/lib/enums'
import {FEEDBACK_TYPE_VALUES, PRIORITY_VALUES, FeedbackType, Priority} from "@/lib/types/feedback-types";

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

const getValidationRules = (tValidation: (key: string, params?: Record<string, any>) => string): Partial<Record<keyof FeedbackFormData, (value: any) => string | null>> => ({
  type: (value: string) => {
    if (!value?.trim()) return tValidation('required')
    return null
  },
  title: (value: string) => {
    if (!value?.trim()) return tValidation('required')
    if (value.trim().length < 5) return tValidation('minLength', { min: 5 })
    return null
  },
  description: (value: string) => {
    if (!value?.trim()) return tValidation('required')
    if (value.trim().length < 10) return tValidation('minLength', { min: 10 })
    return null
  },
  priority: (value: string) => {
    if (!value?.trim()) return tValidation('required')
    return null
  },
})

export function useFeedbackForm(): UseFeedbackFormReturn {
  const { toast } = useToast()
  const t = useTranslations('feedback')
  const tValidation = useTranslations('validation')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialData: FeedbackFormData = {
    type: '',
    title: '',
    description: '',
    priority: '',
    useCase: '',
    stepsToReproduce: ''
  }

  const validationRules = getValidationRules(tValidation)
  
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
    label: type === FeedbackType.feature ? t('typeFeature') : type === FeedbackType.bug ? t('typeBug') : t('typeGeneral'),
    description: type === FeedbackType.feature ? 'Suggest a new feature or improvement' : type === FeedbackType.bug ? 'Report a problem or error' : 'Share your thoughts or concerns'
  }))

  const priorities = PRIORITY_VALUES.map(priority => ({
    value: priority,
    label: priority === Priority.low ? 'Low Priority - Minor issue' : priority === Priority.medium ? 'Medium Priority - Moderate impact' : 'High Priority - Major issue'
  }))

  const updateField = (field: keyof FeedbackFormData, value: string) => {
    updateFormField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: tValidation('error'),
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
        const typeLabel = feedbackTypes.find(type => type.value === formData.type)?.label || t('title')
        toast({
          title: `${typeLabel} ${t('submitting').replace('...', '')}`,
          description: 'Thank you for your feedback! We\'ll review it carefully.',
        })
        resetForm()
      } else {
        toast({
          title: tCommon('error'),
          description: result.error || 'Failed to submit feedback',
          variant: ToastVariant.DESTRUCTIVE,
        })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: tCommon('error'),
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