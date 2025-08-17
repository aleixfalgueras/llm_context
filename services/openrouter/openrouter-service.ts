/**
 * OpenRouter service - handles API communication, usage tracking, and stream processing
 */

import OpenAI from 'openai'
import {processOpenRouterStream} from './stream-handler'
import {logger} from '@/lib/logger'
import {
  getDefaultFrequencyPenalty,
  getDefaultMaxTokens,
  getDefaultModel,
  getDefaultPresencePenalty,
  getDefaultTemperature
} from '@/lib/models-config'
import {SubscriptionUsageService} from "@/services/subscription/subscription-usage-service"
import {OpenRouterCompletionOptions, StreamChunk, UsageTrackingOptions} from "@/lib/types/openrouter-types";

/**
 * OpenRouter service using OpenAI SDK (OpenRouter is OpenAI-compatible)
 */
export class OpenRouterService {
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
   * Create a streaming completion with usage tracking
   */
  async *createStreamingCompletion(
    options: OpenRouterCompletionOptions,
    usageOptions?: UsageTrackingOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const finalOptions = this.applyDefaults(options)
    
    // Ensure model is provided
    if (!finalOptions.model) {
      throw new Error('Model is required for completion')
    }
    
    try {
      const stream = await this.client.chat.completions.create({
        ...finalOptions,
        model: finalOptions.model,
        stream: true
      })
      
      let finalChunk: StreamChunk | null = null
      
      for await (const chunk of processOpenRouterStream(stream)) {
        if (chunk.isComplete) {
          finalChunk = chunk
        }
        yield chunk
      }
      
      // Track usage after stream completes - either from stream or fallback
      if (finalChunk?.isComplete && usageOptions) {
        await this.handleUsageTracking(finalChunk, finalOptions, usageOptions)
      }
    } catch (error) {
      logger.error('OpenRouter streaming error', error instanceof Error ? error : new Error(String(error)))
      throw error
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
    
    // Ensure model is provided
    if (!finalOptions.model) {
      throw new Error('Model is required for completion')
    }
    
    try {
      const completion = await this.client.chat.completions.create({
        ...finalOptions,
        model: finalOptions.model,
        stream: false
      })
      
      const content = completion.choices[0]?.message?.content || ''
      const usage = completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      } : undefined
      
      // Track usage if options provided
      if (usage && usageOptions) {
        await this.trackUsage(usageOptions, {
          model: finalOptions.model,
          totalTokens: usage.totalTokens,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          serviceSource: 'openrouter'
        })
      }
      
      return { content, usage }
    } catch (error) {
      logger.error('OpenRouter completion error', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
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
      usage: options.usage ?? { include: true }, // Enable usage tracking by default
      messages: options.messages
    }
  }

  /**
   * Handle usage tracking with fallback to generation stats API
   */
  private async handleUsageTracking(
    finalChunk: StreamChunk,
    options: OpenRouterCompletionOptions,
    usageOptions: UsageTrackingOptions
  ): Promise<void> {
    let usage = finalChunk.usage
    
    // Fallback: Query generation stats if usage data is missing
    if (!usage && finalChunk.generationId) {
      try {
          logger.debug('No usage data in stream, querying generation stats', {
          metadata: { generationId: finalChunk.generationId }
        });
        
        // Add a small delay - generation stats might not be immediately available
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const stats = await this.getGenerationStats(finalChunk.generationId);
        
        if (stats.data && (stats.data.tokens_prompt || stats.data.tokens_completion)) {
          usage = {
            promptTokens: stats.data.tokens_prompt || 0,
            completionTokens: stats.data.tokens_completion || 0,
            totalTokens: (stats.data.tokens_prompt || 0) + (stats.data.tokens_completion || 0)
          };
          
          logger.debug('Retrieved usage from generation stats', {
            metadata: { generationId: finalChunk.generationId, usage }
          });
        } else {
          logger.warn('Generation stats available but no token data', { 
            metadata: { generationId: finalChunk.generationId, stats }
          });
        }
      } catch (error) {
        logger.warn('Failed to get generation stats, using content-based estimation', { 
          metadata: { 
            generationId: finalChunk.generationId,
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
    
    // Track usage if we have data
    if (usage && usage.totalTokens > 0) {
      await this.trackUsage(usageOptions, {
        model: options.model || getDefaultModel(),
        totalTokens: usage.totalTokens,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        serviceSource: 'openrouter'
      })
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
      await SubscriptionUsageService.trackUsage(
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