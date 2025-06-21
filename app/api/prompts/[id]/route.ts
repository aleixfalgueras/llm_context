import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/prompts/[id] - Get specific prompt
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const prompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!prompt) {
      return new Response('Prompt not found', { status: 404 })
    }

    return Response.json(prompt)
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// PUT /api/prompts/[id] - Update prompt
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const { name, description, content, category, isActive } = await request.json()

    // Validate required fields
    if (!name || !content) {
      return new Response('Name and content are required', { status: 400 })
    }

    const prompt = await prisma.prompt.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name,
        description,
        content,
        category,
        isActive,
      },
    })

    if (prompt.count === 0) {
      return new Response('Prompt not found', { status: 404 })
    }

    // Fetch and return updated prompt
    const updatedPrompt = await prisma.prompt.findFirst({
      where: { id, userId },
    })

    return Response.json(updatedPrompt)
  } catch (error) {
    console.error('Error updating prompt:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// DELETE /api/prompts/[id] - Delete prompt
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const prompt = await prisma.prompt.deleteMany({
      where: {
        id,
        userId,
      },
    })

    if (prompt.count === 0) {
      return new Response('Prompt not found', { status: 404 })
    }

    return new Response('Prompt deleted', { status: 200 })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 