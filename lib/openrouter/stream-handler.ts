/**
 * OpenRouter streaming response handler
 */

import { logger } from '../logger'
import { handleOpenRouterError } from './error-handler'
import type { StreamChunk } from './client'

/**
 * Process OpenRouter streaming completion
 */
export async function* processOpenRouterStream(
  stream: AsyncIterable<any>,
  serviceSource: string = 'openrouter'
): AsyncGenerator<StreamChunk, void, unknown> {
  let totalContent = ''
  let finalUsage: StreamChunk['usage'] | undefined
  
  try {
    for await (const chunk of stream) {
      try {
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
          // Extract usage from final chunk if available
          if (chunk.usage) {
            finalUsage = {
              promptTokens: chunk.usage.prompt_tokens || 0,
              completionTokens: chunk.usage.completion_tokens || 0,
              totalTokens: chunk.usage.total_tokens || 0
            }
          }
          
          // Final chunk with completion info
          yield {
            content: '',
            isComplete: true,
            usage: finalUsage
          }
          
          logger.debug('Stream completed', {
            metadata: {
              totalTokens: finalUsage?.totalTokens,
              serviceSource,
              contentLength: totalContent.length
            }
          })
          
          return
        }
      } catch (chunkError) {
        logger.error('Error processing stream chunk', chunkError instanceof Error ? chunkError : new Error(String(chunkError)))
        // Continue processing other chunks
      }
    }
  } catch (error) {
    logger.error('OpenRouter streaming error', error instanceof Error ? error : new Error(String(error)))
    handleOpenRouterError(error)
  }
}

/**
 * Convert stream to string (for non-streaming use cases)
 */
export async function streamToString(
  stream: AsyncIterable<any>
): Promise<{ content: string; usage?: StreamChunk['usage'] }> {
  let content = ''
  let usage: StreamChunk['usage'] | undefined
  
  for await (const chunk of processOpenRouterStream(stream)) {
    if (chunk.content) {
      content += chunk.content
    }
    if (chunk.isComplete && chunk.usage) {
      usage = chunk.usage
    }
  }
  
  return { content, usage }
}