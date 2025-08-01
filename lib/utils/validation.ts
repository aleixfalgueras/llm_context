/**
 * Centralized validation helpers to eliminate duplicate validation patterns
 * across forms and API routes. Provides consistent validation logic and error messages.
 */

import { ValidationResult } from '@/lib/types/api-types'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (international format)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/

/**
 * Common validation functions
 */
export const validators = {
  required: (value: string | null | undefined, fieldName = 'Field') => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`
    }
    return null
  },

  email: (value: string | null | undefined) => {
    if (!value) return null // Use with required() for mandatory emails
    if (!EMAIL_REGEX.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  phone: (value: string | null | undefined) => {
    if (!value) return null // Use with required() for mandatory phones
    if (!PHONE_REGEX.test(value)) {
      return 'Please enter a valid phone number'
    }
    return null
  },

  minLength: (value: string | null | undefined, min: number, fieldName = 'Field') => {
    if (!value) return null
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
    return null
  },

  maxLength: (value: string | null | undefined, max: number, fieldName = 'Field') => {
    if (!value) return null
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`
    }
    return null
  },

  clientName: (value: string | null | undefined) => {
    const requiredError = validators.required(value, 'Client name')
    if (requiredError) return requiredError
    
    const lengthError = validators.minLength(value, 2, 'Client name')
    if (lengthError) return lengthError
    
    return null
  },

  promptName: (value: string | null | undefined) => {
    const requiredError = validators.required(value, 'Prompt name')
    if (requiredError) return requiredError
    
    const lengthError = validators.minLength(value, 3, 'Prompt name')
    if (lengthError) return lengthError
    
    return null
  },

  promptContent: (value: string | null | undefined) => {
    const requiredError = validators.required(value, 'Prompt content')
    if (requiredError) return requiredError
    
    const lengthError = validators.minLength(value, 10, 'Prompt content')
    if (lengthError) return lengthError
    
    return null
  }
}

// ValidationResult is now imported from @/types/api-types for single source of truth

/**
 * Validates multiple fields at once and returns consolidated result
 */
export function validateFields(
  validations: Record<string, () => string | null>
): ValidationResult {
  const errors: Record<string, string> = {}
  
  for (const [field, validate] of Object.entries(validations)) {
    const error = validate()
    if (error) {
      errors[field] = error
    }
  }
  
  const isValid = Object.keys(errors).length === 0
  const firstError = isValid ? undefined : Object.values(errors)[0]
  
  return { isValid, errors, firstError }
}

/**
 * Client form validation schema
 */
export function validateClientForm(data: {
  name?: string | null
  email?: string | null
  phone?: string | null
}) {
  return validateFields({
    name: () => validators.clientName(data.name),
    email: () => validators.email(data.email),
    phone: () => validators.phone(data.phone)
  })
}

/**
 * Prompt form validation schema
 */
export function validatePromptForm(data: {
  name?: string | null
  content?: string | null
  category?: string | null
}) {
  return validateFields({
    name: () => validators.promptName(data.name),
    content: () => validators.promptContent(data.content),
    category: () => validators.required(data.category, 'Category')
  })
}

/**
 * Document form validation schema
 */
export function validateDocumentForm(data: {
  documentName?: string | null
  content?: string | null
}) {
  return validateFields({
    documentName: () => validators.required(data.documentName, 'Document name'),
    content: () => validators.minLength(data.content, 1, 'Document content')
  })
}

/**
 * Utility to check if a value is empty (null, undefined, or empty string)
 */
export function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === ''
}

/**
 * Utility to sanitize string input (trim and handle null/undefined)
 */
export function sanitizeString(value: string | null | undefined): string {
  return value?.trim() || ''
}

/**
 * Form field error state helper
 */
export function getFieldError(
  errors: Record<string, string>,
  field: string
): string | undefined {
  return errors[field]
}

/**
 * Check if field has error
 */
export function hasFieldError(
  errors: Record<string, string>,
  field: string
): boolean {
  return Boolean(errors[field])
}

/**
 * Process client data by trimming context fields
 */
export function processClientData<T extends Record<string, any>>(data: T): T {
  const processed = { ...data }
  
  // Trim context fields if they exist
  if ('generalContext' in processed && processed.generalContext) {
    (processed as any).generalContext = sanitizeString((processed as any).generalContext)
  }
  if ('specificContext1' in processed && processed.specificContext1) {
    (processed as any).specificContext1 = sanitizeString((processed as any).specificContext1)
  }
  if ('specificContext2' in processed && processed.specificContext2) {
    (processed as any).specificContext2 = sanitizeString((processed as any).specificContext2)
  }
  if ('specificContext3' in processed && processed.specificContext3) {
    (processed as any).specificContext3 = sanitizeString((processed as any).specificContext3)
  }
  
  return processed
}

/**
 * API validation helpers to eliminate duplicate validation patterns in API routes
 */
export const apiValidation = {
  /**
   * Validate required fields for meeting report generation
   */
  meetingReport: (data: {
    clientId?: string | null
    meetingDate?: string | null
    reportContent?: string | null
  }) => {
    const missing: string[] = []
    
    if (!data.clientId) missing.push('clientId')
    if (!data.meetingDate) missing.push('meetingDate')
    if (!data.reportContent) missing.push('reportContent')
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  },

  /**
   * Validate required fields for chat export
   */
  chatExport: (data: {
    clientId?: string | null
    content?: string | null
    chatTitle?: string | null
  }) => {
    const missing: string[] = []
    
    if (!data.clientId) missing.push('clientId')
    if (!data.content) missing.push('content')
    if (!data.chatTitle) missing.push('chatTitle')
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }
}