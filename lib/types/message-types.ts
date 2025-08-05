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
