/**
 * OpenRouter service - orchestrates client, error handling, and usage tracking
 */

import { OpenRouterClient, OpenRouterCompletionOptions, StreamChunk } from './client'
import { handleOpenRouterError } from './error-handler'
import { processOpenRouterStream, streamToString } from './stream-handler'
import { trackUsage } from '../usage-middleware'
import { logger } from '../logger'
import { 
  getDefaultModel, 
  getDefaultTemperature, 
  getDefaultMaxTokens,
  getDefaultPresencePenalty, 
  getDefaultFrequencyPenalty 
} from '../models-config'

export interface UsageTrackingOptions {
  userId: string
  resourceId?: string
  additionalMetadata?: Record<string, any>
}

export class OpenRouterService {
  private client: OpenRouterClient

  constructor() {
    this.client = new OpenRouterClient()
  }

  /**
   * Create a streaming completion with usage tracking
   */
  async *createStreamingCompletion(
    options: OpenRouterCompletionOptions,
    usageOptions?: UsageTrackingOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const finalOptions = this.applyDefaults(options)
    
    try {
      const stream = await this.client.createStreamingCompletion(finalOptions)
      
      let totalTokens = 0
      let promptTokens = 0
      let completionTokens = 0
      
      for await (const chunk of processOpenRouterStream(stream, 'openrouter')) {
        yield chunk
        
        // Track usage when stream completes
        if (chunk.isComplete && chunk.usage && usageOptions) {
          totalTokens = chunk.usage.totalTokens
          promptTokens = chunk.usage.promptTokens
          completionTokens = chunk.usage.completionTokens
          
          await this.trackUsage(usageOptions, {
            model: finalOptions.model || getDefaultModel(),
            totalTokens,
            promptTokens,
            completionTokens,
            serviceSource: 'openrouter'
          })
        }
      }
    } catch (error) {
      handleOpenRouterError(error)
    }
  }

  /**
   * Create a non-streaming completion with usage tracking
   */
  async createCompletion(
    options: OpenRouterCompletionOptions,
    usageOptions?: UsageTrackingOptions
  ): Promise<{ content: string; usage?: StreamChunk['usage'] }> {
    const finalOptions = this.applyDefaults(options)
    
    try {
      const completion = await this.client.createCompletion(finalOptions)
      
      const content = completion.choices[0]?.message?.content || ''
      const usage = completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      } : undefined
      
      // Track usage if options provided
      if (usage && usageOptions) {
        await this.trackUsage(usageOptions, {
          model: finalOptions.model || getDefaultModel(),
          totalTokens: usage.totalTokens,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          serviceSource: 'openrouter'
        })
      }
      
      return { content, usage }
    } catch (error) {
      handleOpenRouterError(error)
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      return await this.client.getModels()
    } catch (error) {
      handleOpenRouterError(error)
    }
  }

  /**
   * Get credit information
   */
  async getCredits() {
    try {
      return await this.client.getCredits()
    } catch (error) {
      handleOpenRouterError(error)
    }
  }

  /**
   * Apply default values to completion options
   */
  private applyDefaults(options: OpenRouterCompletionOptions): OpenRouterCompletionOptions {
    return {
      model: options.model || getDefaultModel(),
      temperature: options.temperature ?? getDefaultTemperature(),
      max_tokens: options.max_tokens ?? getDefaultMaxTokens(),
      presence_penalty: options.presence_penalty ?? getDefaultPresencePenalty(),
      frequency_penalty: options.frequency_penalty ?? getDefaultFrequencyPenalty(),
      messages: options.messages
    }
  }

  /**
   * Track usage with error handling
   */
  private async trackUsage(
    usageOptions: UsageTrackingOptions,
    usageData: {
      model: string
      totalTokens: number
      promptTokens: number
      completionTokens: number
      serviceSource: string
    }
  ): Promise<void> {
    try {
      await trackUsage(
        usageOptions.userId,
        {
          tokensUsed: usageData.totalTokens,
          model: usageData.model,
          promptTokens: usageData.promptTokens,
          completionTokens: usageData.completionTokens,
          serviceSource: usageData.serviceSource,
          resourceId: usageOptions.resourceId,
          ...usageOptions.additionalMetadata
        }
      )
    } catch (error) {
      logger.error('Failed to track usage', error instanceof Error ? error : new Error(String(error)))
      // Don't throw - usage tracking failure shouldn't break the main flow
    }
  }
}