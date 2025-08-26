/**
 * OpenRouter streaming response handler
 */

import { logger } from '@/lib/logger'

import {StreamChunk} from "@/lib/types/openrouter-types";

/**
 * Process OpenRouter streaming completion
 */
export async function* processOpenRouterStream(stream: AsyncIterable<any>): AsyncGenerator<StreamChunk, void, unknown> {
  let totalContent = ''
  let generationId: string | undefined
  let directCost: number | undefined
  
  try {
    for await (const chunk of stream) {
      try {
        // Capture generation ID for fallback usage queries
        if (chunk.id && !generationId) {
          generationId = chunk.id
        }
        
        // Check for direct cost in chunk.usage (final chunk from OpenRouter)
        if (chunk.usage?.cost !== undefined) {
          directCost = chunk.usage.cost
          logger.debug('Direct cost extracted from stream chunk')
        }
        
        const choice = chunk.choices?.[0]
        
        if (!choice) {
          continue
        }
        
        const delta = choice.delta
        const content = delta?.content || ''
        
        if (content) {
          totalContent += content
          
          yield {
            content,
            isComplete: false
          }
        }
        
        // Check for completion
        if (choice.finish_reason) {
          
          // Final chunk with completion info
          yield {
            content: '',
            isComplete: true,
            generationId: generationId,
            cost_usd: directCost
          }

          return
        }
      } catch (chunkError) {
        logger.error('Error processing stream chunk', chunkError instanceof Error ? chunkError : new Error(String(chunkError)))
        // Continue processing other chunks
      }
    }
  } catch (error) {
    logger.error('OpenRouter streaming error', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Convert stream to string (for non-streaming use cases)
 */
export async function streamToString(
  stream: AsyncIterable<any>
): Promise<{ content: string }> {
  let content = ''
  
  for await (const chunk of processOpenRouterStream(stream)) {
    if (chunk.content) {
      content += chunk.content
    }
  }
  
  return { content }
}