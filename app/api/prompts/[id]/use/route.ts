import { PromptOperations } from '@/database/prompt-operations'
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

    await PromptOperations.incrementPromptUsage(promptId, userId)

    return apiSuccess({ message: 'Prompt usage tracked' })
  },
  { 
    context: 'Track prompt usage',
    allowedMethods: ['POST']
  }
) 