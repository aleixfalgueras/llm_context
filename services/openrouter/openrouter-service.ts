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
import {OpenRouterCompletionOptions, StreamChunk, UsageTrackingOptions, GenerationStats} from "@/lib/types/openrouter-types";

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
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "MIA App",
      },
    })
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
      usage: options.usage ?? { include: true },
      messages: options.messages
    }
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
          
          // Track usage and get cost if usage options provided
          if (usageOptions) {
            const cost = await this.handleUsageTracking(chunk, usageOptions)
            if (cost !== null) {
              // Add cost to the final chunk before yielding
              finalChunk = { ...chunk, cost_usd: cost }
            }
          }
          
          yield finalChunk
        } else {
          yield chunk
        }
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
  ): Promise<{ content: string, cost_usd?: number }> {
    const finalOptions = this.applyDefaults(options)
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
      let trackedCost: number | null = null
      
      // Track cost if we have usage options
      if (usageOptions) {
        // Create a StreamChunk-like object to reuse handleUsageTracking logic
        const finalChunk: StreamChunk = {
          content: '',
          isComplete: true,
          generationId: completion.id,
          cost_usd: (completion as any).usage?.cost
        }
        
        // Use the existing handleUsageTracking method to avoid code duplication
        trackedCost = await this.handleUsageTracking(finalChunk, usageOptions)
      }
      
      return { 
        content, 
        cost_usd: trackedCost ?? undefined 
      }
    } catch (error) {
      logger.error('OpenRouter completion error', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Get generation stats by ID for cost tracking
   */
  async getGenerationStats(generationId: string): Promise<GenerationStats> {    
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
      throw new Error(`Failed to fetch generation stats: ${response.status}. ${errorText}`)
    }
    
    const data = await response.json()
    return data as GenerationStats

  }

  /**
   * Handle usage tracking - use direct cost from stream first, fallback to generation stats API
   * @returns The cost in USD if successfully fetched, null otherwise
   */
  private async handleUsageTracking(
    finalChunk: StreamChunk,
    usageOptions: UsageTrackingOptions
  ): Promise<number | null> {
    // First, try to use direct cost from stream chunk (optimal path)
    if (finalChunk.cost_usd !== undefined) {
      await SubscriptionUsageService.trackCost(usageOptions.userId, finalChunk.cost_usd);
      logger.debug('Successfully tracked cost from direct stream chunk');

      return finalChunk.cost_usd;
    }
    
    // Fallback: use generation stats API if direct cost not available
    if (!finalChunk.generationId) {
      logger.warn('No direct cost or generation ID available, cannot track cost');
      return null;
    }
    
    try {
      logger.debug('Direct cost not available, falling back to generation stats API', {
        metadata: { generationId: finalChunk.generationId }
      });
      
      // Add a small delay - generation stats might not be immediately available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stats = await this.getGenerationStats(finalChunk.generationId);
      
      if (stats.data && stats.data.total_cost !== undefined) {
        await SubscriptionUsageService.trackCost(usageOptions.userId, stats.data.total_cost);
        
        logger.debug('Successfully tracked cost from generation stats fallback', {
          metadata: { 
            generationId: finalChunk.generationId, 
            cost_usd: stats.data.total_cost,
            source: 'generation_stats_api'
          }
        });
        
        return stats.data.total_cost;
      } else {
        logger.warn('Generation stats available but no cost data', { 
          metadata: { generationId: finalChunk.generationId }
        });
        return null;
      }
    } catch (error) {
      logger.error('Failed to track cost from generation stats fallback', 
        error instanceof Error ? error : new Error(String(error)), 
        { 
          metadata: { 
            generationId: finalChunk.generationId
          }
        }
      );
      return null;
    }
  }

}