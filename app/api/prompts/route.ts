import { 
  withEnhancedApi, 
  apiSuccess, 
  extractPagination,
  parseJsonBody,
  ApiContext 
} from '@/lib/middleware/api-middleware'
import { PromptOperations } from '@/lib/database'
import { validatePromptForm } from '@/lib/utils/validation'
import { logger } from '@/lib/logger'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// GET /api/prompts - List user's prompts
export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    try {
      const { searchParams } = req.nextUrl
      const category = searchParams.get('category') || undefined
      const isActive = searchParams.get('active') === 'true' ? true : undefined
      const includeContent = searchParams.get('includeContent') === 'true'
      const pagination = extractPagination(req, { page: 1, limit: 50 })

      // Cap at 100 items per page
      pagination.limit = Math.min(pagination.limit, 100)

      // Get prompts with custom select to optionally include content
      const filters = { category, isActive }
      const config = {
        context: 'Find user prompts',
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          isActive: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          ...(includeContent && { content: true })
        },
        orderBy: [
          { usageCount: 'desc' }, // Most used first
          { updatedAt: 'desc' }, // Then by recent updates
        ]
      }

      const result = await PromptOperations.findUserPrompts(userId, filters, pagination, config)

      if (!result.success) {
        throw new Error(result.error)
      }

      const response = {
        prompts: result.data!.records,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.data!.total!,
          totalPages: Math.ceil(result.data!.total! / pagination.limit)
        }
      }

      return apiSuccess(response)
    } catch (error) {
      logger.error('Error fetching prompts', error as Error, { userId })
      throw error
    }
  },
  { 
    context: 'Get Prompts',
    allowedMethods: ['GET']
  }
)

// POST /api/prompts - Create new prompt
export const POST = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    try {
      const body = await parseJsonBody(req)
      
      // Validate input using centralized validation
      const validation = validatePromptForm(body)
      if (!validation.isValid) {
        logger.warn('Validation failed for prompt creation', { 
          userId,
          metadata: { errors: validation.errors }
        })
        throw new Error(validation.firstError || 'Validation failed')
      }

      // Set default category if not provided
      const promptData = {
        ...body,
        category: body.category || 'general'
      }

      const result = await PromptOperations.createPrompt(userId, promptData)

      if (!result.success) {
        throw new Error(result.error)
      }

      return apiSuccess(result.data, 201)
    } catch (error) {
      logger.error('Error creating prompt', error as Error, { userId })
      throw error
    }
  },
  {
    context: 'Create Prompt',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
) 