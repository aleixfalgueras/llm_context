import { 
  withEnhancedApi, 
  apiSuccess, 
  parseJsonBody,
  ApiContext 
} from '@/lib/api/api-middleware'
import { PromptService } from '@/services/prompt-service'
import { logger } from '@/lib/logger'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// GET /api/prompts - List user's prompts
export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const { searchParams } = req.nextUrl
    const category = searchParams.get('category') || undefined
    const isActive = searchParams.get('active') === 'true' ? true : undefined
    const includeContent = searchParams.get('includeContent') === 'true'

    const filters = { category, isActive, includeContent }

    const result = await PromptService.getUserPrompts(userId, filters)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess(result.data)
  },
  { 
    context: 'Get Prompts',
    allowedMethods: ['GET']
  }
)

// POST /api/prompts - Create new prompt
export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const body = await parseJsonBody(req)
    
    const result = await PromptService.createPrompt(userId, body)

    if (!result.success) {
      throw new Error(result.error)
    }

    return apiSuccess(result.data, 201)
  },
  {
    context: 'Create Prompt',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
) 