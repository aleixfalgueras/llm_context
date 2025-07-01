export interface Message {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: Date
  model?: string
  tokensUsed?: number
  inputTokens?: number
  outputTokens?: number
  isStreaming?: boolean // For UI state during streaming
}

export interface MessageCreate {
  content: string
  role: 'USER' | 'ASSISTANT'
  model?: string
  tokensUsed?: number
  inputTokens?: number
  outputTokens?: number
}

export interface MessageWithTokens extends Message {
  tokensUsed: number
  inputTokens: number
  outputTokens: number
}

export interface DatabaseMessage {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  model: string | null
  tokensUsed: number
  inputTokens: number
  outputTokens: number
  chatId: string
  createdAt: Date
} 