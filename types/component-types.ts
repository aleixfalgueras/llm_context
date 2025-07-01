// Centralized interface definitions for components to avoid duplication

// Document interface - used across document-related components
export interface Document {
  id: string
  documentName: string
  documentType: string
  documentPath: string
  startDate?: Date | null
  endDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Simplified Document interface for combobox usage
export interface DocumentBasic {
  id: string
  documentName: string
  documentType: string
}

// Chat interface - used in chat-related components
export interface Chat {
  id: string
  title: string
  updatedAt: Date
}

// Re-export Prompt interface from existing centralized location for convenience
export type { Prompt } from './prompt-management-types'

// Basic Prompt interface for components that don't need database timestamps
export interface PromptBasic {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
} 