import { PromptService } from '@/services/prompt-service'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/api/api-middleware'

// POST /api/prompts/[id]/use - Track prompt usage
export const POST = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string

    const result = await PromptService.trackPromptUsage(promptId, userId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess({ message: 'Prompt usage tracked' })
  },
  { 
    context: 'Track prompt usage',
    allowedMethods: ['POST']
  }
) 