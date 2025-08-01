import { prisma } from '@/lib/prisma'
import { PromptOperations } from '@/database/prompt-operations'
import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'

// GET /api/prompts/[id] - Get specific prompt
export const GET = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string

    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId,
      },
    })

    if (!prompt) {
      const error = new Error('Prompt not found')
      ;(error as any).status = 404
      throw error
    }

    return apiSuccess(prompt)
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
    const { name, description, content, category, isActive } = await parseJsonBody(req)

    // Validate required fields
    if (!name || !content) {
      throw new Error('Name and content are required')
    }

    const updatedPrompt = await PromptOperations.updatePrompt(promptId, userId, {
      name,
      description,
      content,
      category,
      isActive,
    })

    return apiSuccess(updatedPrompt)
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

    await PromptOperations.deletePrompt(promptId, userId)

    return apiSuccess({ message: 'Prompt deleted' })
  },
  { 
    context: 'Delete prompt',
    allowedMethods: ['DELETE']
  }
) 