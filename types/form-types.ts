/**
 * Centralized form-related type definitions to establish single source of truth
 * for all form interfaces, validation patterns, and form state management.
 */

import { ValidationResult } from './api-types'

// =============================================================================
// BASE FORM INTERFACES
// =============================================================================

/**
 * Base form state interface that all forms should extend
 */
export interface BaseFormState {
  isSubmitting: boolean
  isValid: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
}

/**
 * Base form actions interface that all form hooks should implement
 */
export interface BaseFormActions<T = any> {
  updateField: (field: keyof T, value: any) => void
  updateFields: (fields: Partial<T>) => void
  setFieldError: (field: keyof T, error: string) => void
  clearFieldError: (field: keyof T) => void
  validateField: (field: keyof T) => ValidationResult
  validateForm: () => ValidationResult
  resetForm: () => void
  setSubmitting: (submitting: boolean) => void
}

/**
 * Generic form hook return type combining state and actions
 */
export interface UseFormReturn<T = any> extends BaseFormState {
  data: T
  actions: BaseFormActions<T>
  handleSubmit: (onSubmit: (data: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>
}

// =============================================================================
// ASYNC OPERATION TYPES
// =============================================================================

/**
 * Configuration for async operations in forms
 */
export interface AsyncOperationConfig {
  /** Show loading state during operation */
  showLoading?: boolean
  /** Timeout in milliseconds */
  timeout?: number
  /** Retry configuration */
  retry?: {
    attempts: number
    delay: number
  }
  /** Success message to display */
  successMessage?: string
  /** Error message prefix */
  errorPrefix?: string
}

/**
 * State for async operations
 */
export interface AsyncOperationState {
  isLoading: boolean
  error: string | null
  success: boolean
  lastOperation: string | null
  retryCount: number
}

/**
 * Actions for async operations
 */
export interface AsyncOperationActions {
  execute: <T>(operation: () => Promise<T>, config?: AsyncOperationConfig) => Promise<T | null>
  reset: () => void
  clearError: () => void
  retry: () => Promise<void>
}

/**
 * Return type for useAsyncOperation hook
 */
export interface UseAsyncOperationReturn {
  state: AsyncOperationState
  actions: AsyncOperationActions
  /** Legacy properties for backward compatibility */
  isLoading: boolean
  error: string | null
  execute: AsyncOperationActions['execute']
  reset: AsyncOperationActions['reset']
}

// =============================================================================
// SPECIFIC FORM TYPES
// =============================================================================

/**
 * Client form data interface
 */
export interface ClientFormData {
  name: string
  email?: string
  phone?: string
  country: string
  language: string
  generalContext?: string
  specifiContext1?: string
  specifiContext2?: string
  specifiContext3?: string
}

/**
 * Client form return type
 */
export interface UseClientFormReturn extends UseFormReturn<ClientFormData> {
  availableLanguages: Array<{ code: string; name: string; nativeName: string }>
  isEditing: boolean
  clientId: string | null
  handleSave: () => Promise<void>
  handleCancel: () => void
}

/**
 * Document form data interface
 */
export interface DocumentFormData {
  documentName: string
  documentType: string
  content: string
  clientId: string
  metadata?: Record<string, any>
}

/**
 * Prompt form data interface
 */
export interface PromptFormData {
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  variables?: string[]
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Field validation function type
 */
export type FieldValidator<T = any> = (value: T, formData?: any) => string | null

/**
 * Form validation schema type
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: FieldValidator<T[K]>
}

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  validator: FieldValidator
  message?: string
  dependencies?: string[]
}

/**
 * Field validation configuration
 */
export interface FieldValidation {
  rules: ValidationRule[]
  required?: boolean
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

// =============================================================================
// FORM EVENT TYPES
// =============================================================================

/**
 * Form field change event
 */
export interface FormFieldChangeEvent<T = any> {
  field: string
  value: T
  previousValue: T
  isValid: boolean
  error?: string
}

/**
 * Form submission event
 */
export interface FormSubmissionEvent<T = any> {
  data: T
  isValid: boolean
  errors: Record<string, string>
  preventDefault: () => void
}

// =============================================================================
// FORM CONFIGURATION TYPES
// =============================================================================

/**
 * Form configuration interface
 */
export interface FormConfig<T = any> {
  /** Initial form data */
  initialData: T
  /** Validation schema */
  validation?: ValidationSchema<T>
  /** Whether to validate on change */
  validateOnChange?: boolean
  /** Whether to validate on blur */
  validateOnBlur?: boolean
  /** Whether to prevent submission with errors */
  preventInvalidSubmission?: boolean
  /** Auto-save configuration */
  autoSave?: {
    enabled: boolean
    debounceMs: number
    onSave: (data: T) => Promise<void>
  }
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Form UI state for complex forms
 */
export interface FormUIState {
  currentStep?: number
  totalSteps?: number
  isExpanded?: boolean
  activeSection?: string
  showAdvanced?: boolean
  previewMode?: boolean
}

/**
 * Form UI actions
 */
export interface FormUIActions {
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  toggleExpanded: () => void
  setActiveSection: (section: string) => void
  toggleAdvanced: () => void
  togglePreview: () => void
}