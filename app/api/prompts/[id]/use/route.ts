import { prisma } from '@/lib/prisma'
import { 
  withEnhancedApi, 
  apiSuccess,
  ApiContext 
} from '@/lib/api-middleware'

// POST /api/prompts/[id]/use - Track prompt usage
export const POST = withEnhancedApi(
  async ({ userId, params }: ApiContext) => {
    const { id } = params!
    const promptId = id as string

    // Increment usage count
    const prompt = await prisma.prompt.updateMany({
      where: {
        id: promptId,
        userId,
        isActive: true,
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })

    if (prompt.count === 0) {
      const error = new Error('Prompt not found or inactive')
      ;(error as any).status = 404
      throw error
    }

    return apiSuccess({ message: 'Prompt usage tracked' })
  },
  { 
    context: 'Track prompt usage',
    allowedMethods: ['POST']
  }
) 