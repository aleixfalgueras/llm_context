import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/prompts/[id]/use - Track prompt usage
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params

    // Increment usage count
    const prompt = await prisma.prompt.updateMany({
      where: {
        id,
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
      return new Response('Prompt not found or inactive', { status: 404 })
    }

    return new Response('Prompt usage tracked', { status: 200 })
  } catch (error) {
    console.error('Error tracking prompt usage:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 