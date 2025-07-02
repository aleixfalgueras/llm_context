import { NextRequest } from 'next/server'
import { 
  withEnhancedApi, 
  apiSuccess, 
  extractPagination,
  parseJsonBody,
  ApiContext 
} from '@/lib/api-middleware'
import { PromptOperations } from '@/lib/database'
import { validatePromptForm } from '@/lib/validation-helpers'
import { logger, withTiming } from '@/lib/logger'

// Force dynamic rendering since we use auth() which accesses headers
export const dynamic = 'force-dynamic'

// GET /api/prompts - List user's prompts
export const GET = withEnhancedApi(
  async ({ userId, req }: ApiContext) => {
    const endTiming = logger.startTiming('Get Prompts API')
    logger.apiRequest('GET', '/api/prompts')

    try {
      const { searchParams } = req.nextUrl
      const category = searchParams.get('category') || undefined
      const isActive = searchParams.get('active') === 'true' ? true : undefined
      const includeContent = searchParams.get('includeContent') === 'true'
      const pagination = extractPagination(req, { page: 1, limit: 50 })

      // Cap at 100 items per page
      pagination.limit = Math.min(pagination.limit, 100)

      logger.dbQuery('findMany', 'prompt', { userId })
      
      const result = await withTiming(
        'Fetch prompts from DB',
        async () => {
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

          return await PromptOperations.findUserPrompts(userId, filters, pagination, config)
        },
        { userId }
      )

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

      logger.apiResponse('GET', '/api/prompts', 200, { userId })
      endTiming()
      return apiSuccess(response)
    } catch (error) {
      logger.error('Error fetching prompts', error as Error, { userId })
      logger.apiResponse('GET', '/api/prompts', 500)
      endTiming()
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
    const endTiming = logger.startTiming('Create Prompt API')
    logger.apiRequest('POST', '/api/prompts')

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

      logger.dbQuery('create', 'prompt', { userId })
      
      const result = await withTiming(
        'Create prompt in DB',
        () => PromptOperations.createPrompt(userId, promptData),
        { userId }
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      logger.apiResponse('POST', '/api/prompts', 201, { userId })
      endTiming()
      return apiSuccess(result.data, 201)
    } catch (error) {
      logger.error('Error creating prompt', error as Error, { userId })
      logger.apiResponse('POST', '/api/prompts', 500)
      endTiming()
      throw error
    }
  },
  {
    context: 'Create Prompt',
    allowedMethods: ['POST'],
    expectedContentType: 'application/json'
  }
) 