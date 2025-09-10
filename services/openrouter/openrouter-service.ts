import OpenAI from 'openai'
import {logger} from '@/lib/logger'
import {
  MODEL_IDS
} from '@/lib/models-config'
import {SubscriptionUsageService} from "@/services/subscription/subscription-usage-service"
import {
  GenerationStats,
  ImageGenerationResponse,
  OpenRouterCompletionOptions,
  StreamChunk,
  UsageTrackingOptions
} from "@/lib/types/openrouter-types"
import {StreamingProvider} from "@/lib/types/streaming-types"
import {StreamErrorHandler} from "@/services/chat/stream-error-utils"
import {
  getDefaultFrequencyPenalty,
  getDefaultMaxTokens, getDefaultModel,
  getDefaultPresencePenalty,
  getDefaultTemperature
} from "@/lib/utils/model-utils";

/**
 * Process OpenRouter streaming completion
 */
export async function* processOpenRouterStream(stream: AsyncIterable<any>): AsyncGenerator<StreamChunk, void, unknown> {
  let totalContent = ''
  let generationId: string | undefined
  let directCost: number | undefined
  let hasFinished = false

  try {
    for await (const chunk of stream) {
      try {
        // Capture generation ID for fallback usage queries
        if (chunk.id && !generationId) {
          generationId = chunk.id
        }

        // Check for direct cost in chunk.usage (may come before, with, or after finish_reason)
        if (chunk.usage?.cost !== undefined) {
          directCost = chunk.usage.cost
          logger.debug('Direct cost extracted from stream chunk')

          // If we already marked as finished, yield complete chunk with cost and exit
          if (hasFinished) {
            yield {
              content: '',
              isComplete: true,
              generationId: generationId,
              cost_usd: directCost
            }
            return
          }
        }

        const choice = chunk.choices?.[0]

        if (!choice) {
          continue
        }

        const delta = choice.delta
        const content = delta?.content || ''

        // Check for images in delta (for image generation models)
        if (delta?.images && Array.isArray(delta.images)) {
          logger.debug(`${delta.images.length} images detected in stream chunk`)

          // Yield intermediate chunk with images
          yield {
            content: '',
            isComplete: false,
            images: delta.images
          }
        }

        if (content) {
          totalContent += content

          yield {
            content,
            isComplete: false
          }
        }

        // Check for completion
        if (choice.finish_reason && !hasFinished) {
          hasFinished = true
          
          // If we already have cost, yield completion immediately and exit
          if (directCost !== undefined) {
            yield {
              content: '',
              isComplete: true,
              generationId: generationId,
              cost_usd: directCost
            }
            return
          }
          // Otherwise, wait for potential cost chunk or stream end
        }
      } catch (chunkError) {
        StreamErrorHandler.logStreamError(chunkError as Error, {
          phase: 'chunk_processing',
          metadata: { chunkData: JSON.stringify(chunk).substring(0, 200) }
        })
      }
    }
    
    // If stream ended and we finished but haven't yielded completion yet
    if (hasFinished) {
      yield {
        content: '',
        isComplete: true,
        generationId: generationId,
        cost_usd: directCost
      }
    }
  } catch (error) {
    StreamErrorHandler.logStreamError(error as Error, {
      phase: 'openrouter_streaming',
      metadata: { 
        totalContentLength: totalContent.length,
        generationId
      }
    })
    throw error
  }
}

/**
 * OpenRouter service using OpenAI SDK (OpenRouter is OpenAI-compatible)
 */
export class OpenRouterService implements StreamingProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      },
    })
  }

  /**
   * Get the modalities supported by a model (e.g., text, image)
   * @param modelId - The model identifier
   * @returns Array of modalities or undefined for text-only models
   */
  static getModelModalities(modelId: string): ('text' | 'image')[] | undefined {
    // Currently only the Gemini 2.5 Flash Image model supports image generation
    if (modelId === MODEL_IDS.GOOGLE_GEMINI_2_5_FLASH_IMAGE) {
      return ['image', 'text']
    }
    
    // Return undefined for text-only models (default behavior)
    return undefined
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
   * Create a streaming completion with usage tracking
   */
  async *createStreamingCompletion(
    options: OpenRouterCompletionOptions,
    usageOptions?: UsageTrackingOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const finalOptions = this.applyDefaults(options)
    
    try {
      const stream = await this.client.chat.completions.create({
        ...finalOptions,
        messages: finalOptions.messages as any,
        stream_options: {include_usage: true},
        stream: true,
        ...(finalOptions.modalities && { modalities: finalOptions.modalities as any })
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
      const err = error as Error
      const classifiedError = StreamErrorHandler.classifyError(err)
      
      // Always yield error chunk so user gets proper message
      yield {
        content: '',
        isComplete: false,
        error: classifiedError.userFriendlyMessage || err.message
      }
      
      // Log the error for debugging
      StreamErrorHandler.logStreamError(err, {
        userId: usageOptions?.userId,
        phase: 'streaming_completion',
        metadata: { 
          model: finalOptions.model,
          messageCount: finalOptions.messages.length
        }
      })
      
      return
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
        messages: finalOptions.messages as any, // Cast to any for complex message types
        stream: false,
        usage: { include: true },
        ...(finalOptions.modalities && { modalities: finalOptions.modalities as any })
      } as any)
      
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
      StreamErrorHandler.logStreamError(error as Error, {
        userId: usageOptions?.userId,
        phase: 'completion',
        metadata: { 
          model: finalOptions.model,
          messageCount: finalOptions.messages.length
        }
      })
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
   * Generate an image using AI models with image generation capabilities
   */
  async generateImage(
    prompt: string,
    model: string,
    usageOptions?: UsageTrackingOptions
  ): Promise<ImageGenerationResponse> {
    if (!prompt?.trim()) {
      throw new Error('Prompt is required for image generation')
    }

    try {
      const modalities = OpenRouterService.getModelModalities(model)
      
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt.trim(),
          },
        ],
        temperature: 0.7,
        modalities: modalities as any,
        stream: false,
        usage: { include: true }
      } as any)

      // Handle the response according to OpenRouter documentation
      const message = completion.choices[0]?.message
      if (!message) {
        throw new Error('No response from image generation model')
      }

      // Extract image from response
      const images = (message as any).images
      let imageUrl: string

      if (images && Array.isArray(images) && images.length > 0) {
        const firstImage = images[0]
        if (firstImage?.image_url?.url) {
          imageUrl = firstImage.image_url.url
        } else {
          throw new Error('Image data not found in expected format')
        }
      } else if (message.content) {
        // Model didn't return images as expected
        logger.warn('No images field in response, checking content', {
          metadata: {
            contentPreview: message.content.substring(0, 200)
          }
        })
        throw new Error(`Model did not return images. Content: ${message.content.substring(0, 200)}`)
      } else {
        throw new Error('No image generated by the model')
      }

      // Track usage/cost using the centralized tracking method
      let trackedCost: number | null = null
      if (usageOptions) {
        // Create a StreamChunk-like object to reuse handleUsageTracking logic
        const finalChunk: StreamChunk = {
          content: '',
          isComplete: true,
          generationId: completion.id,
          cost_usd: (completion as any).usage?.cost
        }
        
        await this.handleUsageTracking(finalChunk, usageOptions)
      }

      return {
        imageUrl,
        cost_usd: trackedCost ?? undefined
      }
    } catch (error) {
      StreamErrorHandler.logStreamError(error as Error, {
        userId: usageOptions?.userId,
        phase: 'image_generation',
        metadata: { 
          model,
          promptLength: prompt.length
        }
      })
      
      throw error instanceof Error 
        ? error 
        : new Error('Failed to generate image')
    }
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