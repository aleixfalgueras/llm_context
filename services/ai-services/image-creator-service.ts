import {logger} from '@/lib/logger'
import {openRouterService} from '@/services/openrouter'
import {IMAGE_GENERATION_MODEL_ID} from "@/lib/models-config";
import {ImageGenerationRequest, ImageGenerationResponse} from "@/lib/types/ai-service-types";

export class ImageCreatorService {

  static async generateImage(
    userId: string,
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const {prompt} = request

    if (!prompt?.trim()) {
      throw new Error('Prompt is required for image generation')
    }

    try {
      // Use the centralized OpenRouterService for image generation
      const result = await openRouterService.generateImage(
        prompt.trim(),
        IMAGE_GENERATION_MODEL_ID,
        {
          userId,
          additionalMetadata: {
            source: 'image-creator-dialog'
          }
        }
      )

      logger.debug('🎨 Image generation completed', {
        userId,
        operation: 'image-generation-success',
        metadata: {
          model: IMAGE_GENERATION_MODEL_ID,
          hasCost: result.cost_usd !== undefined
        }
      })

      return {
        imageUrl: result.imageUrl,
        prompt
      }
    } catch (error) {
      logger.error('Image generation service error', error instanceof Error ? error : new Error(String(error)), {
        metadata: {
          userId,
          model: IMAGE_GENERATION_MODEL_ID
        }
      })
      
      throw error instanceof Error 
        ? error 
        : new Error('Failed to generate image')
    }
  }

}