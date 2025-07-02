/**
 * API service for AI service operations (generation and saving)
 */

import { AIProviderError, getAIErrorMessage } from './ai-errors'
import type { Client } from '@/types/client'
import { APIResponse } from '@/types/api-types'
import { logger } from './logger'

export class AIServiceAPI {
  /**
   * Generate content using AI service
   */
  static async generateContent<TFormData>(
    endpoint: string,
    payload: any
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        if (response.status === 402) {
          return {
            success: false,
            error: 'Usage limit exceeded. Please upgrade your plan to continue.'
          }
        }

        if (response.status >= 500) {
          return {
            success: false,
            error: 'Server error. Please try again later.'
          }
        }

        return {
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`
        }
      }

      const result: APIResponse = await response.json()
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Generation failed'
        }
      }

      return {
        success: true,
        content: result.data
      }
    } catch (error) {
      logger.error('AI service generation error', error as Error)
      
      if (error instanceof AIProviderError) {
        const errorMsg = getAIErrorMessage(error)
        return {
          success: false,
          error: `${errorMsg.title}: ${errorMsg.description}`
        }
      }

      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      }
    }
  }

  /**
   * Save generated content as document
   */
  static async saveDocument(
    endpoint: string,
    payload: any
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return {
          success: false,
          error: errorData.error || `Save failed with status ${response.status}`
        }
      }

      const result: APIResponse = await response.json()
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Save failed'
        }
      }

      return {
        success: true,
        documentId: result.data?.id
      }
    } catch (error) {
      logger.error('AI service save error', error as Error)
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      }
    }
  }
}