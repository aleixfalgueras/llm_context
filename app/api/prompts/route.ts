import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// GET /api/prompts - List user's prompts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'

    const prompts = await prisma.prompt.findMany({
      where: {
        userId,
        ...(category && { category }),
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [
        { usageCount: 'desc' }, // Most used first
        { updatedAt: 'desc' }, // Then by recent updates
      ],
    })

    return Response.json(prompts)
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// POST /api/prompts - Create new prompt
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { name, description, content, category } = await request.json()

    // Validate required fields
    if (!name || !content) {
      return new Response('Name and content are required', { status: 400 })
    }

    const prompt = await prisma.prompt.create({
      data: {
        userId,
        name,
        description,
        content,
        category: category || 'general',
      },
    })

    return Response.json(prompt, { status: 201 })
  } catch (error) {
    console.error('Error creating prompt:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 