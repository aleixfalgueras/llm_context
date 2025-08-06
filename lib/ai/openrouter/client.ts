/**
 * OpenRouter API client - handles only API communication
 */

import OpenAI from 'openai'

export type AIMessageRole = 'system' | 'user' | 'assistant'

export interface OpenRouterCompletionOptions {
  model?: string
  messages: Array<{role: AIMessageRole, content: string}>
  temperature?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  usage?: { include: boolean }
}

export interface StreamChunk {
  content: string
  isComplete: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  generationId?: string // For fallback usage queries
}

/**
 * OpenRouter API client using OpenAI SDK (OpenRouter is OpenAI-compatible)
 */
export class OpenRouterClient {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "LLM Context App",
      },
    })
  }

  /**
   * Create a streaming chat completion
   */
  async createStreamingCompletion(options: OpenRouterCompletionOptions) {
    // Ensure model is provided
    if (!options.model) {
      throw new Error('Model is required for completion')
    }
    
    return this.client.chat.completions.create({
      ...options,
      model: options.model,
      stream: true
    })
  }

  /**
   * Create a non-streaming chat completion
   */
  async createCompletion(options: OpenRouterCompletionOptions) {
    // Ensure model is provided
    if (!options.model) {
      throw new Error('Model is required for completion')
    }
    
    return this.client.chat.completions.create({
      ...options,
      model: options.model,
      stream: false
    })
  }

  /**
   * Get generation stats by ID (for token usage fallback)
   */
  async getGenerationStats(generationId: string) {    
    // Use query parameter instead of path parameter based on OpenRouter docs
    const url = new URL('https://openrouter.ai/api/v1/generation');
    url.searchParams.append('id', generationId);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch generation stats: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data
  }
}