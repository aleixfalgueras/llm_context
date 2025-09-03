import {ImageCreatorService} from '@/services/ai-services/image-creator-service'
import {ApiContext, parseJsonBody, withEnhancedApi} from '@/lib/api/api-middleware'

export const maxDuration = 60 // 60 seconds timeout for image generation

export const POST = withEnhancedApi(
  async ({userId, req}: ApiContext) => {
    // Parse request body
    const {prompt} = await parseJsonBody(req)

    // Validate required fields
    if (!prompt?.trim()) {
      throw new Error('Prompt is required')
    }

    // Generate the image
    const result = await ImageCreatorService.generateImage(userId, {
      prompt,
      userId
    })

    return Response.json({
      imageUrl: result.imageUrl,
      prompt: result.prompt
    })
  },
  {
    context: 'Generate Image',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json',
    requireUsageCheck: true
  }
)