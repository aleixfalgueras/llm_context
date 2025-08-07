import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'
import { PromptService } from '@/services/prompt-service'

// GET /api/prompts/[id] - Get specific prompt
export const GET = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string

    const result = await PromptService.getPromptById(promptId, userId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess(result.data)
  },
  { 
    context: 'Get prompt',
    allowedMethods: ['GET']
  }
)

// PUT /api/prompts/[id] - Update prompt
export const PUT = withEnhancedApi(
  async ({ userId, req, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string
    const updateData = await parseJsonBody(req)

    const result = await PromptService.updatePrompt(promptId, userId, updateData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess(result.data)
  },
  { 
    context: 'Update prompt',
    allowedMethods: ['PUT'],
    expectedContentType: 'application/json'
  }
)

// DELETE /api/prompts/[id] - Delete prompt
export const DELETE = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string

    const result = await PromptService.deletePrompt(promptId, userId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess({ message: 'Prompt deleted' })
  },
  { 
    context: 'Delete prompt',
    allowedMethods: ['DELETE']
  }
) 