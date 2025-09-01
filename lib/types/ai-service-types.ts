import { Client } from '@prisma/client'

// Custom Document Generation Types
export interface CustomDocumentGenerationRequest {
  clientId: string
  prompt: string
  documentTitle: string
  additionalInstructions?: string
  selectedContextFields?: string[]
  model?: string
}

export interface CustomDocumentGenerationResponse {
  content: string
  promptName: string
  clientName: string
  documentTitle: string
}

export interface CustomDocumentSaveRequest {
  clientId: string
  content: string
  documentTitle: string
  promptName?: string
}

// Meeting Report Generation Types
export interface MeetingReportGenerationRequest {
  clientId: string
  meetingTranscription: string
  meetingDate: string
  additionalInfo?: string
  model?: string
}

export interface MeetingReportGenerationResponse {
  report: string
}

export interface MeetingReportSaveRequest {
  clientId: string
  meetingDate: string
  reportContent: string
  documentName: string
  additionalInfo?: string
}

// Internal Service Types
export interface ProcessedPromptData {
  completePrompt: string
  client: Client
  targetLanguage: string
}

export interface DocumentGenerationContext {
  userId: string
  clientId: string
  promptName: string
  documentTitle: string
}